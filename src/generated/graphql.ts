/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
export type GetVehicleQueryVariables = Exact<{
  tokenId: number;
}>;


export type GetVehicleQuery = { vehicle: { tokenId: number, owner: unknown, name: string, mintedAt: unknown, dcn: { id: string, name: string | null } | null, definition: { make: string | null, model: string | null, year: number | null } | null, aftermarketDevice: { tokenId: number, tokenDID: string, serial: string | null, owner: unknown, pairedAt: unknown, manufacturer: { name: string } } | null, syntheticDevice: { tokenId: number } | null } | null };

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: NonNullable<DocumentTypeDecoration<TResult, TVariables>['__apiType']>;
  private value: string;
  public __meta__?: Record<string, any> | undefined;

  constructor(value: string, __meta__?: Record<string, any> | undefined) {
    super(value);
    this.value = value;
    this.__meta__ = __meta__;
  }

  override toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value;
  }
}

export const GetVehicleDocument = new TypedDocumentString(`
    query GetVehicle($tokenId: Int!) {
  vehicle(tokenId: $tokenId) {
    tokenId
    owner
    dcn {
      id
      name
    }
    name
    mintedAt
    definition {
      make
      model
      year
    }
    aftermarketDevice {
      tokenId
      tokenDID
      serial
      owner
      pairedAt
      manufacturer {
        name
      }
    }
    syntheticDevice {
      tokenId
    }
  }
}
    `) as unknown as TypedDocumentString<GetVehicleQuery, GetVehicleQueryVariables>;