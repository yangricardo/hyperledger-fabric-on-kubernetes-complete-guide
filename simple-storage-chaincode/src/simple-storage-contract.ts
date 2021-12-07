import {
  Context,
  Contract,
  Info,
  Param,
  Returns,
  Transaction
} from "fabric-contract-api";
import { Shim, ChaincodeInterface, ChaincodeResponse } from "fabric-shim";
import { ChaincodeStub } from "fabric-shim-api";
import { SimpleStorageDTO } from "./simple-storage-dto";

@Info({
  title: "Simple Storage Contract",
  description: "Simple Storage Contract example",
  termsOfService: "https://github.com/yangricardo",
  contact: {
    name: "Yang Miranda",
    url: "https://github.com/yangricardo",
    email: "yang@les.inf.puc-rio.br",
  },
  license: {
    name: "Apache 2.0",
    url: "http://www.apache.org/licenses/LICENSE-2.0.html",
  },
  version: "1.0.1",
})
export class SimpleStorageContract
  extends Contract
  implements ChaincodeInterface
{
  @Transaction(false)
  @Returns("ChaincodeResponse")
  public async Init(_stub: ChaincodeStub) {
    console.log("[SimpleStorageContract::init]", "Chaincode initalized");
    return Shim.success();
  }

  @Transaction(true)
  public async Invoke(_stub: ChaincodeStub) {
    console.log(
      "[SimpleStorageContract::Invoke]",
      "Chaincode Test Transaction Invoked"
    );
    return Shim.success();
  }

  @Transaction(false)
  @Param('key', 'string', 'Key to verify if has a value bound on ledger')
  @Returns('boolean')
  public async simpleStorageExists(ctx: Context, key: string) {
    const value = await ctx.stub.getState(key);
    return value && value.length > 0;
  }


  @Transaction(false)
  @Param('key', 'string', 'Key to bind the value on ledger')
  @Param('value', 'string', 'JSON value based on SimpleStorageDTO')
  @Returns('boolean')
  public async createSimpleStorage(ctx: Context, key: string, value: string) {
    const exists = await this.simpleStorageExists(ctx, key);
    if(exists) {
      throw new Error(`The Simple Storage ${key} already exists`);
    }
    try {
      const simpleStorage = SimpleStorageDTO.builder(value);
      await ctx.stub.putState(key, simpleStorage.toBuffer());
    } catch (error) {
      throw error;
    }
  }

  @Transaction(false)
  @Param('key', 'string', 'Key to read the value on ledger')
  @Returns('SimpleStorageDTO')
  public async readSimpleStorage(ctx: Context, key: string) {
    const exists = await this.simpleStorageExists(ctx, key);
    if(!exists) {
      throw new Error(`The Simple Storage ${key} does not exist`);
    }
    try {
      const simpleStorage = SimpleStorageDTO.fromBuffer(
        await ctx.stub.getState(key)
      );
      return simpleStorage;
    } catch (error) {
      throw error;
    }
  }



}
