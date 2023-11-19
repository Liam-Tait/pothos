import builder, { Giraffe } from './builder';

const GiraffeInput = builder.inputType('GiraffeInput', {
  fields: (t) => ({
    name: t.string({ required: true }),
    birthdate: t.string({ required: true }),
    height: t.float({ required: true }),
  }),
});

builder.inputType('FindGiraffeInput', {
  fields: (t) => ({
    name: t.string({ required: true }),
  }),
});

interface RecursiveGiraffeInputShape {
  name: string;
  birthdate: string;
  height: number;
  friends?: RecursiveGiraffeInputShape[];
}

const RecursiveGiraffeInput = builder
  .inputRef<RecursiveGiraffeInputShape>('RecursiveGiraffeInput')
  .implement({
    fields: (t) => ({
      name: t.string({ required: true }),
      birthdate: t.string({ required: true }),
      height: t.float({ required: true }),
      friends: t.field({
        type: [GiraffeInput],
      }),
    }),
  });

builder.mutationType({
  fields: (t) => ({
    createGiraffe: t.field({
      type: Giraffe,
      args: {
        input: t.arg({ type: GiraffeInput, required: true }),
      },
      resolve: (root, args) =>
        new Giraffe(args.input.name, new Date(args.input.birthdate), args.input.height),
    }),
    findGiraffe: t.field({
      type: Giraffe,
      args: {
        where: t.arg({ type: 'FindGiraffeInput', required: true }),
      },
      resolve: (root, args) => new Giraffe(args.where.name, new Date(), 8),
    }),
    createGiraffeWithFriends: t.field({
      type: [Giraffe],
      args: {
        input: t.arg({ type: RecursiveGiraffeInput, required: true }),
      },
      resolve: (root, args) => {
        const date = new Date(Date.UTC(2006, 10, 10));

        const friends = (args.input.friends ?? []).map(
          (friend) => new Giraffe(args.input.name, date, args.input.height),
        );

        return [new Giraffe(args.input.name, date, args.input.height), ...friends];
      },
    }),
  }),
});
