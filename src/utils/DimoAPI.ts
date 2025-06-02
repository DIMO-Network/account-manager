export class DimoAPI {
  private baseUrl = 'https://identity-api.dimo.zone';

  async query(query: string, variables?: any) {
    const response = await fetch(`${this.baseUrl}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query,
        variables 
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async getVehiclesByOwner(ownerAddress: string, limit: number = 10) {
    const query = `
      query GetVehiclesByOwner($owner: Address!, $first: Int!) {
        vehicles(filterBy: { owner: $owner }, first: $first) {
          totalCount
          edges {
            node {
              tokenId
              owner
              mintedAt
              definition {
                make
                model
                year
              }
            }
          }
        }
      }
    `;

    return this.query(query, { owner: ownerAddress, first: limit });
  }
}