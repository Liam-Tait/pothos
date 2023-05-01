import { InputFieldBuilder, RootFieldBuilder, SchemaTypes } from '@pothos/core';

const rootBuilderProto = RootFieldBuilder.prototype as PothosSchemaTypes.RootFieldBuilder<
  SchemaTypes,
  unknown
>;

function capitalize(s: string) {
  return `${s.slice(0, 1).toUpperCase()}${s.slice(1)}`;
}

function defaultGetName({
  parentTypeName,
  fieldName,
}: {
  parentTypeName: string;
  fieldName: string;
}) {
  return `${parentTypeName}${capitalize(fieldName)}Input`;
}

rootBuilderProto.fieldWithInput = function fieldWithInput({
  typeOptions: { name: typeName, ...typeOptions } = {},
  argOptions: { name: argName = 'input', ...argOptions } = {},
  args,
  input,
  ...fieldOptions
}) {
  const fieldRef = this.field(
    (builder) =>
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      ({
        args: {
          ...args,
          [argName]: this.arg({
            required: true,
            ...builder.options.withInput?.argOptions,
            ...(argOptions as {}),
            type: builder.inputRef(typeName ?? `UnnamedWithInput`),
          }),
        },
        ...fieldOptions,
      } as never),
  );

  fieldRef.onConfig((config, builder) => {
    const { name: getTypeName = defaultGetName, ...defaultTypeOptions } =
      builder.options.withInput?.typeOptions ?? {};

    const name =
      typeName ?? getTypeName({ parentTypeName: config.parentType, fieldName: config.name });

    builder.inputType(name, {
      fields: () => input,
      ...defaultTypeOptions,
      ...typeOptions,
    } as never);
  });

  return fieldRef;
};

Object.defineProperty(rootBuilderProto, 'input', {
  get: function getInputBuilder(this: RootFieldBuilder<SchemaTypes, unknown>) {
    return new InputFieldBuilder('InputObject', `UnnamedWithInput`);
  },
});
