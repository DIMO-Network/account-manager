/* eslint-disable */
import * as types from './graphql';



/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query GetVehicle($tokenId: Int!) {\n    vehicle(tokenId: $tokenId) {\n      tokenId\n      owner\n      dcn {\n        id\n        name\n      }\n      name\n      mintedAt\n      definition {\n        make\n        model\n        year\n      }\n      aftermarketDevice {\n        tokenId\n        tokenDID\n        serial\n        owner\n        pairedAt\n        manufacturer {\n          name\n        }\n      }\n      syntheticDevice {\n        tokenId\n      }\n    }\n  }\n": typeof types.GetVehicleDocument,
    "\n  query GetVehiclesByOwner($owner: Address!, $first: Int!) {\n    vehicles(filterBy: { owner: $owner }, first: $first) {\n      totalCount\n      edges {\n        node {\n          tokenId\n          owner\n          mintedAt\n          definition {\n            make\n            model\n            year\n          }\n          aftermarketDevice {\n            tokenId\n            tokenDID\n            serial\n            owner\n            pairedAt\n            manufacturer {\n              name\n            }\n          }\n        }\n      }\n    }\n  }\n": typeof types.GetVehiclesByOwnerDocument,
};
const documents: Documents = {
    "\n  query GetVehicle($tokenId: Int!) {\n    vehicle(tokenId: $tokenId) {\n      tokenId\n      owner\n      dcn {\n        id\n        name\n      }\n      name\n      mintedAt\n      definition {\n        make\n        model\n        year\n      }\n      aftermarketDevice {\n        tokenId\n        tokenDID\n        serial\n        owner\n        pairedAt\n        manufacturer {\n          name\n        }\n      }\n      syntheticDevice {\n        tokenId\n      }\n    }\n  }\n": types.GetVehicleDocument,
    "\n  query GetVehiclesByOwner($owner: Address!, $first: Int!) {\n    vehicles(filterBy: { owner: $owner }, first: $first) {\n      totalCount\n      edges {\n        node {\n          tokenId\n          owner\n          mintedAt\n          definition {\n            make\n            model\n            year\n          }\n          aftermarketDevice {\n            tokenId\n            tokenDID\n            serial\n            owner\n            pairedAt\n            manufacturer {\n              name\n            }\n          }\n        }\n      }\n    }\n  }\n": types.GetVehiclesByOwnerDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetVehicle($tokenId: Int!) {\n    vehicle(tokenId: $tokenId) {\n      tokenId\n      owner\n      dcn {\n        id\n        name\n      }\n      name\n      mintedAt\n      definition {\n        make\n        model\n        year\n      }\n      aftermarketDevice {\n        tokenId\n        tokenDID\n        serial\n        owner\n        pairedAt\n        manufacturer {\n          name\n        }\n      }\n      syntheticDevice {\n        tokenId\n      }\n    }\n  }\n"): typeof import('./graphql').GetVehicleDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetVehiclesByOwner($owner: Address!, $first: Int!) {\n    vehicles(filterBy: { owner: $owner }, first: $first) {\n      totalCount\n      edges {\n        node {\n          tokenId\n          owner\n          mintedAt\n          definition {\n            make\n            model\n            year\n          }\n          aftermarketDevice {\n            tokenId\n            tokenDID\n            serial\n            owner\n            pairedAt\n            manufacturer {\n              name\n            }\n          }\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').GetVehiclesByOwnerDocument;


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
