import { FunctionType, Program } from "dvm-utils/dist/types/program";
import { DVMType } from "dvm-utils/src/types/program";

// TODO use `import * as ts from "typescript";`
export function generateLib() {
  const result = `
  import {
    Api as XSWDApi,
    Result,
    scinvokeSCArgs,
    to,
    Uint64,
    gasEstimateSCArgs,
    DEROGetSC,
    WalletTransfer,
  } from "dero-xswd-api";
  
  export function f_getsc(xswd: XSWDApi, scid: string) {
    return async (args: Omit<DEROGetSC, "scid">) => {
      const response = await xswd.node.GetSC({
        scid,
        ...args,
      });
      const [error, result] = to<"daemon", "DERO.GetSC", Result>(response);
      if (error) {
        throw "could not get SC data: " + error.message;
      }
      if (result === undefined) {
        throw "unexpected error: no result in GetSC";
      }
      return result;
    };
  }
  
  export function f_transfer(
    xswd: XSWDApi,
    scid: string,
    fname: string,
    args: {
      name: string;
      value: number | string;
    }[],
    transfers: WalletTransfer[],
    fees?: Uint64,
    ringsize?: Uint64
  ) {
    return async () => {
      const response = await xswd.wallet.transfer({
        scid,
        sc_rpc: gasEstimateSCArgs(scid, fname, args),
        transfers,
        ringsize,
        fees,
      });
      const [error, result] = to<"wallet", "transfer", Result>(response);
      if (error) {
        throw "Could not call function " + fname + ": " + error.message;
      }
      return await xswd.waitFor("new_entry", (v) => v.txid == result?.txid);
    };
  }
  
  export function f_scinvoke(
    xswd: XSWDApi,
    scid: string,
    fname: string,
    args: {
      name: string;
      value: number | string;
    }[],
    sc_dero_deposit?: Uint64,
    sc_token_deposit?: Uint64,
    ringsize?: Uint64
  ) {
    return async () => {
      const response = await xswd.wallet.scinvoke({
        scid,
        sc_rpc: scinvokeSCArgs(fname, args),
        sc_dero_deposit,
        sc_token_deposit,
        ringsize,
      });
      const [error, result] = to<"wallet", "scinvoke", Result>(response);
      if (error) {
        throw "Could not call function " + fname + ": " + error.message;
      }
      return await xswd.waitFor("new_entry", (v) => v.txid == result?.txid);
    };
  }
  
  export function f_scinvoke_gas(
    xswd: XSWDApi,
    scid: string,
    fname: string,
    args: {
      name: string;
      value: number | string;
    }[],
    transfers: WalletTransfer[] = []
  ) {
    return async () => {
      const addressResponse = await xswd.wallet.GetAddress();
      const [addressError, addressResult] = to<"wallet", "GetAddress", Result>(
        addressResponse
      );
      if (addressError) {
        throw "could not get address: " + addressError.message;
      }
  
      const response = await xswd.node.GetGasEstimate({
        signer: addressResult?.address,
        sc_rpc: gasEstimateSCArgs(scid, fname, args),
        transfers,
      });
      const [error, result] = to<"daemon", "DERO.GetGasEstimate", Result>(
        response
      );
      if (error) {
        throw (
          "Could not estimate gas for function " + fname + ": " + error.message
        );
      }
      return result;
    };
  }
  
  export function to_args(args: object) {
    return Object.entries(args).map(([name, value]) => ({ name, value }));
  }
  
`;
  return result;
}

export function generateApi(program: Program) {
  const functions = program.functions.filter(
    (f) => f.name[0].toUpperCase() == f.name[0]
  );
  console.log("Public functions: ", functions.map((f) => f.name).join(", "));

  return `
import { Api as XSWDApi, Hash, DVMString, Uint64, WalletTransfer } from "dero-xswd-api";
import { f_getsc, f_transfer, f_scinvoke, f_scinvoke_gas, to_args } from "../lib";

const getSCApi = (xswd: XSWDApi, scid: Hash) => {
  return {
    getSC: f_getsc(xswd, scid),
    ${functions.map((f) => generateFunction(f)).join(",\n    ")}
  };
};

export { getSCApi };
  
  `;
}

function generateFunction(f: FunctionType): any {
  return `${f.name}: (args: { ${f.args
    .map(
      (arg) =>
        `${arg.name}: ${arg.type == DVMType.Uint64 ? "Uint64" : "DVMString"}`
    )
    .join(
      ";"
    )} }) => ({scinvoke: (sc_dero_deposit?: Uint64, sc_token_deposit?: Uint64, ringsize?: Uint64) => 
      f_scinvoke(xswd, scid, "${
        f.name
      }", to_args(args),sc_dero_deposit, sc_token_deposit, ringsize)(), transfer: (transfers: WalletTransfer[] = [], fees?: Uint64, ringsize?: Uint64) => f_transfer(xswd, scid, "${
    f.name
  }", to_args(args), transfers, fees, ringsize)(),
      gas: (transfers: WalletTransfer[] = []) => f_scinvoke_gas(xswd, scid, "${
        f.name
      }", to_args(args), transfers)()
  })`;
}
