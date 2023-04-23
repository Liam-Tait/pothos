import { FieldRequiredness, InputFieldBuilder, ObjectRef, SchemaTypes } from '@pothos/core';
import { GlobalIDInputFieldOptions, GlobalIDListInputFieldOptions } from './types';

type DefaultSchemaTypes = PothosSchemaTypes.ExtendDefaultTypes<{}>;

const inputFieldBuilder = InputFieldBuilder.prototype as PothosSchemaTypes.InputFieldBuilder<
  DefaultSchemaTypes,
  'Arg' | 'InputObject'
>;

inputFieldBuilder.globalIDList = function globalIDList<Req extends FieldRequiredness<['ID']>>(
  {
    for: forTypes,
    ...options
  }: GlobalIDListInputFieldOptions<DefaultSchemaTypes, Req, 'Arg' | 'InputObject'> = {} as never,
) {
  const idRef = this.idList(options);

  idRef.onConfig((config, builder) => ({
    ...config,
    extensions: {
      ...options.extensions,
      isRelayGlobalID: true,
      relayGlobalIDFor:
        (
          (forTypes && (Array.isArray(forTypes) ? forTypes : [forTypes])) as ObjectRef<
            SchemaTypes,
            unknown
          >[]
        )?.map((type: ObjectRef<SchemaTypes, unknown>) => ({
          typename: builder.configStore.getTypeConfig(type).name,
          parseId: 'parseId' in type ? type.parseId : undefined,
        })) ?? null,
    },
  }));

  return idRef as never;
};

inputFieldBuilder.globalID = function globalID<Req extends boolean>(
  {
    for: forTypes,
    ...options
  }: GlobalIDInputFieldOptions<DefaultSchemaTypes, Req, 'Arg' | 'InputObject'> = {} as never,
) {
  const idRef = this.id(options);

  idRef.onConfig((config, builder) => ({
    ...config,
    extensions: {
      ...config.extensions,
      isRelayGlobalID: true,
      relayGlobalIDFor:
        (
          (forTypes && (Array.isArray(forTypes) ? forTypes : [forTypes])) as ObjectRef<
            SchemaTypes,
            unknown
          >[]
        )?.map((type: ObjectRef<SchemaTypes, unknown>) => ({
          typename: builder.configStore.getTypeConfig(type).name,
          parseId: 'parseId' in type ? type.parseId : undefined,
        })) ?? null,
    },
  }));

  return idRef as never;
};

inputFieldBuilder.connectionArgs = function connectionArgs() {
  return {
    before: this.field((builder) => ({
      ...builder.options.relay?.beforeArgOptions,
      type: builder.options.relay?.cursorType ?? 'String',
      required: false,
    })),
    after: this.field((builder) => ({
      ...builder.options.relay?.afterArgOptions,
      type: builder.options.relay?.cursorType ?? 'String',
      required: false,
    })),
    first: this.field((builder) => ({
      ...builder.options.relay?.firstArgOptions,
      type: 'Int',
      required: false,
    })),
    last: this.field((builder) => ({
      ...builder.options.relay?.lastArgOptions,
      type: 'Int',
      required: false,
    })),
  };
};
