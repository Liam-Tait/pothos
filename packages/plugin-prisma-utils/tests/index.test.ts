import { execute, printSchema } from 'graphql';
import { gql } from 'graphql-tag';
import { prisma } from './example/builder';
import schema from './example/schema';

let queries: unknown[] = [];
prisma.$use((params, next) => {
  queries.push(params);

  return next(params);
});

describe('prisma utils', () => {
  afterEach(() => {
    queries = [];
  });

  it('generates schema', () => {
    expect(printSchema(schema)).toMatchSnapshot();
  });

  it('returns filtered posts', async () => {
    const query = gql`
      query {
        posts(
          order: { author: { name: Asc, profile: null } }
          filter: { id: { not: { equals: 23752, not: null } } }
        ) {
          id
        }
      }
    `;

    const result = await execute({
      schema,
      document: query,
      contextValue: { user: { id: 1 } },
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "data": {
          "posts": [
            {
              "id": "23751",
            },
            {
              "id": "23753",
            },
            {
              "id": "23754",
            },
          ],
        },
      }
    `);

    expect(queries).toMatchInlineSnapshot(`
      [
        {
          "action": "findMany",
          "args": {
            "orderBy": {
              "author": {
                "name": "asc",
                "profile": undefined,
              },
            },
            "take": 3,
            "where": {
              "id": {
                "not": {
                  "equals": 23752,
                  "not": undefined,
                },
              },
            },
          },
          "dataPath": [],
          "model": "Post",
          "runInTransaction": false,
        },
      ]
    `);
  });
});