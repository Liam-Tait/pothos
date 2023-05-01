import { GraphQLResolveInfo } from 'graphql';
import {
  assertArray,
  FieldKind,
  FieldNullability,
  InputFieldMap,
  InputShapeFromFields,
  InterfaceRef,
  ObjectRef,
  RootFieldBuilder,
  SchemaTypes,
} from '@pothos/core';
import {
  ConnectionShape,
  GlobalIDFieldOptions,
  GlobalIDListFieldOptions,
  GlobalIDShape,
} from './types';
import { capitalize, resolveNodes } from './utils';
import { internalDecodeGlobalID, internalEncodeGlobalID } from './utils/internal';

const fieldBuilderProto = RootFieldBuilder.prototype as PothosSchemaTypes.RootFieldBuilder<
  SchemaTypes,
  unknown,
  FieldKind
>;

fieldBuilderProto.globalIDList = function globalIDList<
  Args extends InputFieldMap,
  Nullable extends FieldNullability<['ID']>,
  ResolveReturnShape,
>({
  resolve,
  ...options
}: GlobalIDListFieldOptions<SchemaTypes, unknown, Args, Nullable, ResolveReturnShape, FieldKind>) {
  return this.field((builder) => ({
    ...options,
    type: ['ID'],
    resolve: (async (
      parent: unknown,
      args: InputShapeFromFields<Args>,
      context: object,
      info: GraphQLResolveInfo,
    ) => {
      const result = await resolve(parent, args, context, info);

      if (!result) {
        return result;
      }

      assertArray(result);

      if (Array.isArray(result)) {
        return (
          (await Promise.all(result)) as (GlobalIDShape<SchemaTypes> | null | undefined)[]
        ).map((item) =>
          item == null || typeof item === 'string'
            ? item
            : internalEncodeGlobalID(
                builder,
                builder.configStore.getTypeConfig(item.type).name,
                String(item.id),
                context,
              ),
        );
      }

      return null;
    }) as never,
  }));
};

fieldBuilderProto.globalID = function globalID<
  Args extends InputFieldMap,
  Nullable extends FieldNullability<'ID'>,
  ResolveReturnShape,
>({
  resolve,
  ...options
}: GlobalIDFieldOptions<SchemaTypes, unknown, Args, Nullable, ResolveReturnShape, FieldKind>) {
  return this.field((builder) => ({
    ...options,
    type: 'ID',
    resolve: (async (
      parent: unknown,
      args: InputShapeFromFields<Args>,
      context: object,
      info: GraphQLResolveInfo,
    ) => {
      const result = await resolve(parent, args, context, info);

      if (!result || typeof result === 'string') {
        return result;
      }

      const item = result as unknown as GlobalIDShape<SchemaTypes>;

      return internalEncodeGlobalID(
        builder,
        builder.configStore.getTypeConfig(item.type).name,
        String(item.id),
        context,
      );
    }) as never, // resolve is not expected because we don't know FieldKind
  }));
};

fieldBuilderProto.node = function node({ id, ...options }) {
  return this.field<{}, InterfaceRef<SchemaTypes, unknown>, unknown, Promise<unknown>, true>(
    (builder) => ({
      ...(options as {}),
      type: builder.nodeInterfaceRef(),
      nullable: true,
      resolve: async (parent: unknown, args: {}, context: object, info: GraphQLResolveInfo) => {
        const rawID = (await id(parent, args as never, context, info)) as unknown as
          | GlobalIDShape<SchemaTypes>
          | string
          | null
          | undefined;

        if (rawID == null) {
          return null;
        }

        const globalID =
          typeof rawID === 'string'
            ? internalDecodeGlobalID(builder, rawID, context, info, true)
            : rawID && {
                id: rawID.id,
                typename: builder.configStore.getTypeConfig(rawID.type).name,
              };

        return (await resolveNodes(builder, context, info, [globalID]))[0];
      },
    }),
  );
};

fieldBuilderProto.nodeList = function nodeList({ ids, ...options }) {
  return this.field((builder) => ({
    ...options,
    nullable: {
      list: false,
      items: true,
    },
    type: [builder.nodeInterfaceRef()],
    resolve: async (parent: unknown, args: {}, context: object, info: GraphQLResolveInfo) => {
      const rawIDList = await ids(parent, args as never, context, info);

      assertArray(rawIDList);

      if (!Array.isArray(rawIDList)) {
        return [];
      }

      const rawIds = (await Promise.all(rawIDList)) as (
        | GlobalIDShape<SchemaTypes>
        | string
        | null
        | undefined
      )[];

      const globalIds = rawIds.map((id) =>
        typeof id === 'string'
          ? internalDecodeGlobalID(builder, id, context, info, true)
          : id && {
              id: id.id,
              typename: builder.configStore.getTypeConfig(id.type).name,
            },
      );

      return resolveNodes(builder, context, info, globalIds);
    },
  }));
};

fieldBuilderProto.connection = function connection(
  { type, edgesNullable, nodeNullable, ...fieldOptions },
  connectionOptionsOrRef = {} as never,
  edgeOptionsOrRef = {} as never,
) {
  const connectionRef =
    connectionOptionsOrRef instanceof ObjectRef
      ? connectionOptionsOrRef
      : new ObjectRef<SchemaTypes, ConnectionShape<SchemaTypes, unknown, boolean>>(
          'Unnamed connection',
        );

  const fieldRef = this.field((builder) => ({
    ...builder.options.relay?.defaultConnectionFieldOptions,
    ...fieldOptions,
    type: connectionRef,
    args: {
      ...fieldOptions.args,
      ...this.arg.connectionArgs(),
    },
    resolve: fieldOptions.resolve as never,
  }));

  if (!(connectionOptionsOrRef instanceof ObjectRef)) {
    fieldRef.onConfig((fieldConfig, builder) => {
      const connectionName =
        connectionOptionsOrRef.name ??
        `${fieldConfig.parentType}${capitalize(fieldConfig.name)}${
          fieldConfig.name.toLowerCase().endsWith('connection') ? '' : 'Connection'
        }`;

      builder.connectionObject(
        {
          type,
          edgesNullable,
          nodeNullable,
          ...connectionOptionsOrRef,
          name: connectionName,
        },
        edgeOptionsOrRef instanceof ObjectRef
          ? edgeOptionsOrRef
          : {
              name: `${connectionName}Edge`,
              ...edgeOptionsOrRef,
            },
      );

      // builder.configStore.associateRefWithName(connectionRef, connectionName);
    });
  }

  return fieldRef as never;
};
