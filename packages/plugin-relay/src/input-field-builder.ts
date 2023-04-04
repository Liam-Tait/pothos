import {
  FieldRequiredness,
  InputFieldBuilder,
  InputFieldRef,
  InputShapeFromTypeParam,
  ObjectRef,
  SchemaTypes,
} from '@pothos/core';
import {
  GlobalIDInputFieldOptions,
  GlobalIDInputShape,
  GlobalIDListInputFieldOptions,
} from './types';

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
  return this.idList({
    ...options,
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
          typename: this.builder.configStore.getTypeConfig(type).name,
          parseId: 'parseId' in type ? type.parseId : undefined,
        })) ?? null,
    },
  }) as never;
};

inputFieldBuilder.globalID = function globalID<Req extends boolean>(
  {
    for: forTypes,
    ...options
  }: GlobalIDInputFieldOptions<DefaultSchemaTypes, Req, 'Arg' | 'InputObject'> = {} as never,
) {
  return this.id({
    ...options,
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
          typename: this.builder.configStore.getTypeConfig(type).name,
          parseId: 'parseId' in type ? type.parseId : undefined,
        })) ?? null,
    },
  }) as unknown as InputFieldRef<
    SchemaTypes,
    InputShapeFromTypeParam<DefaultSchemaTypes, GlobalIDInputShape, Req>
  > as never;
};

inputFieldBuilder.connectionArgs = function connectionArgs() {
  const {
    cursorType = 'String',
    beforeArgOptions = {} as never,
    afterArgOptions = {} as never,
    firstArgOptions = {} as never,
    lastArgOptions = {} as never,
  } = this.builder.options.relay ?? {};

  return {
    before: this.field({ ...beforeArgOptions, type: cursorType, required: false }),
    after: this.field({ ...afterArgOptions, type: cursorType, required: false }),
    first: this.int({ ...firstArgOptions, required: false }),
    last: this.int({ ...lastArgOptions, required: false }),
  };
};
