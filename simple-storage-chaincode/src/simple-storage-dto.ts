import { Object, Property } from "fabric-contract-api";

@Object()
export class SimpleStorageDTO {

  // Enable unknown key value properties
  [key: string]: any;

  @Property('value', 'string')
  value?: string;

  public static builder(value: string) {
    const simpleStorage = new SimpleStorageDTO();
    const parsedValue = JSON.parse(value);
    return { ...simpleStorage, ...parsedValue }
  }

  toBuffer() {
    return Buffer.from(JSON.stringify(this));
  }

  public static fromBuffer(buffer: Uint8Array) {
    return this.builder(buffer.toString());
  }
}
