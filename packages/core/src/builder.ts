import {
  GraphQLBoolean,
  GraphQLDirective,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLScalarSerializer,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLString,
  GraphQLTypeResolver,
  lexicographicSortSchema,
} from 'graphql';
import { BuildCache } from './build-cache';
import { ConfigStore } from './config-store';
import { PothosError, PothosSchemaError } from './errors';
import { InputFieldBuilder } from './fieldUtils/input';
import { InterfaceFieldBuilder } from './fieldUtils/interface';
import { MutationFieldBuilder } from './fieldUtils/mutation';
import { ObjectFieldBuilder } from './fieldUtils/object';
import { QueryFieldBuilder } from './fieldUtils/query';
import { SubscriptionFieldBuilder } from './fieldUtils/subscription';
import { BaseTypeRef } from './refs/base';
import { EnumRef } from './refs/enum';
import { ImplementableInputObjectRef, InputObjectRef } from './refs/input-object';
import { ImplementableInterfaceRef, InterfaceRef } from './refs/interface';
import { MutationRef } from './refs/mutation';
import { ImplementableObjectRef, ObjectRef } from './refs/object';
import { QueryRef } from './refs/query';
import { ScalarRef } from './refs/scalar';
import { SubscriptionRef } from './refs/subscription';
import { UnionRef } from './refs/union';
import type {
  AbstractReturnShape,
  AddVersionedDefaultsToBuilderOptions,
  BaseEnum,
  EnumParam,
  EnumTypeOptions,
  EnumValues,
  InputFieldMap,
  InputFieldsFromShape,
  InputShape,
  InputShapeFromFields,
  InterfaceFieldsShape,
  InterfaceFieldThunk,
  InterfaceParam,
  InterfaceTypeOptions,
  MutationFieldsShape,
  MutationFieldThunk,
  NormalizeArgs,
  NormalizeSchemeBuilderOptions,
  ObjectFieldsShape,
  ObjectFieldThunk,
  ObjectParam,
  ObjectTypeOptions,
  OutputShape,
  ParentShape,
  PluginConstructorMap,
  QueryFieldsShape,
  QueryFieldThunk,
  ScalarName,
  SchemaTypes,
  ShapeFromEnumValues,
  SubscriptionFieldsShape,
  SubscriptionFieldThunk,
  ValuesFromEnum,
} from './types';
import { normalizeEnumValues, valuesFromEnum, verifyInterfaces, verifyRef } from './utils';

export class SchemaBuilder<Types extends SchemaTypes> {
  static plugins: Partial<PluginConstructorMap<SchemaTypes>> = {};
  static optionNormalizers: Map<
    string,
    {
      v3?: (
        options: NormalizeSchemeBuilderOptions<SchemaTypes & { Defaults: 'v3' }>,
      ) => Partial<NormalizeSchemeBuilderOptions<SchemaTypes>>;
      v4?: undefined;
    }
  > = new Map();

  static allowPluginReRegistration = false;

  configStore: ConfigStore<Types>;

  options: PothosSchemaTypes.SchemaBuilderOptions<Types>;

  defaultFieldNullability: boolean;

  defaultInputFieldRequiredness: boolean;

  constructor(options: PothosSchemaTypes.SchemaBuilderOptions<Types>) {
    this.options = [...SchemaBuilder.optionNormalizers.values()].reduce((opts, normalize) => {
      if (options.defaults && typeof normalize[options.defaults] === 'function') {
        return {
          ...opts,
          ...normalize[options.defaults]!(
            opts as NormalizeSchemeBuilderOptions<SchemaTypes & { Defaults: 'v3' }>,
          ),
        };
      }

      return opts;
    }, options);

    this.configStore = new ConfigStore<Types>(this);

    this.defaultFieldNullability =
      (
        options as {
          defaultFieldNullability?: boolean;
        }
      ).defaultFieldNullability ?? false;

    this.defaultInputFieldRequiredness =
      (
        options as {
          defaultInputFieldRequiredness?: boolean;
        }
      ).defaultInputFieldRequiredness ?? false;
  }

  static registerPlugin<T extends keyof PluginConstructorMap<SchemaTypes>>(
    name: T,
    plugin: PluginConstructorMap<SchemaTypes>[T],
    normalizeOptions?: {
      v3?: (
        options: AddVersionedDefaultsToBuilderOptions<SchemaTypes, 'v3'>,
      ) => Partial<NormalizeSchemeBuilderOptions<SchemaTypes>>;
    },
  ) {
    if (!this.allowPluginReRegistration && this.plugins[name]) {
      throw new PothosError(`Received multiple implementations for plugin ${name}`);
    }

    this.plugins[name] = plugin;

    if (normalizeOptions) {
      this.optionNormalizers.set(name, normalizeOptions);
    }
  }

  objectType<Interfaces extends InterfaceParam<Types>[], Param extends ObjectParam<Types>>(
    param: Param,
    options: ObjectTypeOptions<Types, Param, ParentShape<Types, Param>, Interfaces>,
    fields?: ObjectFieldsShape<Types, ParentShape<Types, Param>>,
  ): PothosSchemaTypes.ObjectRef<Types, OutputShape<Types, Param>, ParentShape<Types, Param>> {
    verifyRef(param);
    verifyInterfaces(options.interfaces);

    const name =
      typeof param === 'string'
        ? param
        : (options as { name?: string }).name ?? (param as { name: string }).name;

    if (name === 'Query' || name === 'Mutation' || name === 'Subscription') {
      throw new PothosSchemaError(`Invalid object name ${name} use .create${name}Type() instead`);
    }

    const ref =
      param instanceof BaseTypeRef
        ? (param as ObjectRef<Types, OutputShape<Types, Param>, ParentShape<Types, Param>>)
        : new ObjectRef<Types, OutputShape<Types, Param>, ParentShape<Types, Param>>(name);

    ref.initConfig({
      kind: 'Object',
      graphqlKind: 'Object',
      name,
      interfaces: [],
      description: options.description,
      extensions: options.extensions,
      isTypeOf: options.isTypeOf,
      pothosOptions: options as PothosSchemaTypes.ObjectTypeOptions,
    });

    if (options.interfaces) {
      ref.addInterfaces(options.interfaces);
    }

    if (ref !== param && typeof ref !== 'string') {
      this.configStore.associateParamWithRef(param, ref);
    }

    if (fields) {
      ref.addFields(() => fields(new ObjectFieldBuilder<Types, ParentShape<Types, Param>>()));
    }

    if (options.fields) {
      ref.addFields(() => {
        const t = new ObjectFieldBuilder<Types, ParentShape<Types, Param>>();

        return options.fields!(t);
      });
    }

    this.configStore.addImplementedTypeRef(ref);

    return ref;
  }

  objectFields<Type extends ObjectParam<Types>>(
    param: Type,
    fields: ObjectFieldsShape<Types, ParentShape<Types, Type>>,
  ) {
    verifyRef(param);
    this.configStore.addFields(param, () =>
      fields(new ObjectFieldBuilder<Types, ParentShape<Types, Type>>()),
    );
  }

  objectField<Type extends ObjectParam<Types>>(
    param: Type,
    fieldName: string,
    field: ObjectFieldThunk<Types, ParentShape<Types, Type>>,
  ) {
    verifyRef(param);
    this.configStore.addFields(param, () => ({
      [fieldName]: field(new ObjectFieldBuilder<Types, ParentShape<Types, Type>>()),
    }));
  }

  queryType(
    ...args: NormalizeArgs<
      [options: PothosSchemaTypes.QueryTypeOptions<Types>, fields?: QueryFieldsShape<Types>],
      0
    >
  ): QueryRef<Types> {
    const [options = {}, fields] = args;

    const ref = new QueryRef<Types>('Query');

    ref.initConfig({
      kind: 'Query',
      graphqlKind: 'Object',
      name: 'Query',
      description: options.description,
      pothosOptions: options as unknown as PothosSchemaTypes.QueryTypeOptions,
      extensions: options.extensions,
    });

    this.configStore.addImplementedTypeRef(ref);

    if (fields) {
      ref.addFields(() => fields(new QueryFieldBuilder()));
    }

    if (options.fields) {
      ref.addFields(() => options.fields!(new QueryFieldBuilder()));
    }

    return ref;
  }

  queryFields(fields: QueryFieldsShape<Types>) {
    this.configStore.addFields('Query', () => fields(new QueryFieldBuilder()));
  }

  queryField(name: string, field: QueryFieldThunk<Types>) {
    this.configStore.addFields('Query', () => ({
      [name]: field(new QueryFieldBuilder()),
    }));
  }

  mutationType(
    ...args: NormalizeArgs<
      [options: PothosSchemaTypes.MutationTypeOptions<Types>, fields?: MutationFieldsShape<Types>],
      0
    >
  ) {
    const [options = {}, fields] = args;

    const ref = new MutationRef<Types>('Mutation');

    ref.initConfig({
      kind: 'Mutation',
      graphqlKind: 'Object',
      name: 'Mutation',
      description: options.description,
      pothosOptions: options as unknown as PothosSchemaTypes.MutationTypeOptions,
      extensions: options.extensions,
    });

    this.configStore.addImplementedTypeRef(ref);

    if (fields) {
      this.configStore.addFields('Mutation', () => fields(new MutationFieldBuilder()));
    }

    if (options.fields) {
      this.configStore.addFields('Mutation', () => options.fields!(new MutationFieldBuilder()));
    }

    return ref;
  }

  mutationFields(fields: MutationFieldsShape<Types>) {
    this.configStore.addFields('Mutation', () => fields(new MutationFieldBuilder()));
  }

  mutationField(name: string, field: MutationFieldThunk<Types>) {
    this.configStore.addFields('Mutation', () => ({
      [name]: field(new MutationFieldBuilder()),
    }));
  }

  subscriptionType(
    ...args: NormalizeArgs<
      [
        options: PothosSchemaTypes.SubscriptionTypeOptions<Types>,
        fields?: SubscriptionFieldsShape<Types>,
      ],
      0
    >
  ) {
    const [options = {}, fields] = args;

    const ref = new SubscriptionRef<Types>('Subscription');

    ref.initConfig({
      kind: 'Subscription',
      graphqlKind: 'Object',
      name: 'Subscription',
      description: options.description,
      pothosOptions: options as unknown as PothosSchemaTypes.SubscriptionTypeOptions,
      extensions: options.extensions,
    });

    this.configStore.addImplementedTypeRef(ref);

    if (fields) {
      this.configStore.addFields('Subscription', () => fields(new SubscriptionFieldBuilder()));
    }

    if (options.fields) {
      this.configStore.addFields('Subscription', () =>
        options.fields!(new SubscriptionFieldBuilder()),
      );
    }

    return ref;
  }

  subscriptionFields(fields: SubscriptionFieldsShape<Types>) {
    this.configStore.addFields('Subscription', () => fields(new SubscriptionFieldBuilder()));
  }

  subscriptionField(name: string, field: SubscriptionFieldThunk<Types>) {
    this.configStore.addFields('Subscription', () => ({
      [name]: field(new SubscriptionFieldBuilder()),
    }));
  }

  args<Shape extends InputFieldMap>(
    fields: (t: PothosSchemaTypes.InputFieldBuilder<Types, 'Arg'>) => Shape,
  ): Shape {
    return fields(new InputFieldBuilder<Types, 'Arg'>('Arg'));
  }

  interfaceType<
    Param extends InterfaceParam<Types>,
    Interfaces extends InterfaceParam<Types>[],
    ResolveType,
  >(
    param: Param,
    options: InterfaceTypeOptions<Types, Param, ParentShape<Types, Param>, Interfaces, ResolveType>,
    fields?: InterfaceFieldsShape<Types, ParentShape<Types, Param>>,
  ): PothosSchemaTypes.InterfaceRef<
    Types,
    AbstractReturnShape<Types, Param, ResolveType>,
    ParentShape<Types, Param>
  > {
    verifyRef(param);
    verifyInterfaces(options.interfaces);

    const name =
      typeof param === 'string'
        ? param
        : (options as { name?: string }).name ?? (param as { name: string }).name;

    const ref =
      param instanceof BaseTypeRef
        ? (param as InterfaceRef<
            Types,
            AbstractReturnShape<Types, Param, ResolveType>,
            ParentShape<Types, Param>
          >)
        : new InterfaceRef<
            Types,
            AbstractReturnShape<Types, Param, ResolveType>,
            ParentShape<Types, Param>
          >(name);

    const typename = ref.name;

    ref.initConfig({
      kind: 'Interface',
      graphqlKind: 'Interface',
      name: typename,
      interfaces: [],
      description: options.description,
      pothosOptions: options as unknown as PothosSchemaTypes.InterfaceTypeOptions,
      extensions: options.extensions,
      resolveType: options.resolveType as GraphQLTypeResolver<unknown, unknown>,
    });

    this.configStore.addImplementedTypeRef(ref);

    if (options.interfaces) {
      ref.addInterfaces(options.interfaces);
    }

    if (ref !== param && typeof param !== 'string') {
      this.configStore.associateParamWithRef(param, ref);
    }

    if (fields) {
      this.configStore.addFields(ref, () => fields(new InterfaceFieldBuilder()));
    }

    if (options.fields) {
      this.configStore.addFields(ref, () => options.fields!(new InterfaceFieldBuilder()));
    }

    return ref;
  }

  interfaceFields<Type extends InterfaceParam<Types>>(
    ref: Type,
    fields: InterfaceFieldsShape<Types, ParentShape<Types, Type>>,
  ) {
    verifyRef(ref);

    this.configStore.addFields(ref, () => fields(new InterfaceFieldBuilder()));
  }

  interfaceField<Type extends InterfaceParam<Types>>(
    ref: Type,
    fieldName: string,
    field: InterfaceFieldThunk<Types, ParentShape<Types, Type>>,
  ) {
    verifyRef(ref);

    this.configStore.addFields(ref, () => ({
      [fieldName]: field(new InterfaceFieldBuilder()),
    }));
  }

  unionType<Member extends ObjectParam<Types>, ResolveType>(
    name: string,
    options: PothosSchemaTypes.UnionTypeOptions<Types, Member, ResolveType>,
  ): PothosSchemaTypes.UnionRef<
    Types,
    AbstractReturnShape<Types, Member, ResolveType>,
    ParentShape<Types, Member>
  > {
    const ref = new UnionRef<
      Types,
      AbstractReturnShape<Types, Member, ResolveType>,
      ParentShape<Types, Member>
    >(name);

    if (Array.isArray(options.types)) {
      options.types.forEach((type) => {
        verifyRef(type);
      });
    }

    ref.initConfig({
      kind: 'Union',
      graphqlKind: 'Union',
      name,
      types: [],
      description: options.description,
      resolveType: options.resolveType as GraphQLTypeResolver<unknown, object>,
      pothosOptions: options as unknown as PothosSchemaTypes.UnionTypeOptions,
      extensions: options.extensions,
    });

    this.configStore.addImplementedTypeRef(ref);

    ref.addTypes(options.types);

    return ref;
  }

  enumType<Param extends EnumParam, Values extends EnumValues<Types>>(
    param: Param,
    options: EnumTypeOptions<Types, Param, Values>,
  ): PothosSchemaTypes.EnumRef<
    Types,
    Param extends BaseEnum ? ValuesFromEnum<Param> : ShapeFromEnumValues<Types, Values>
  > {
    verifyRef(param);
    const name = typeof param === 'string' ? param : (options as { name: string }).name;
    const ref = new EnumRef<
      Types,
      Param extends BaseEnum ? ValuesFromEnum<Param> : ShapeFromEnumValues<Types, Values>
    >(name);

    const values =
      typeof param === 'object'
        ? // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
          valuesFromEnum<Types>(param as BaseEnum)
        : normalizeEnumValues<Types>((options as { values: EnumValues<Types> }).values);

    ref.initConfig({
      kind: 'Enum',
      graphqlKind: 'Enum',
      name,
      values,
      description: options.description,
      pothosOptions: options as unknown as PothosSchemaTypes.EnumTypeOptions<Types>,
      extensions: options.extensions,
    });

    this.configStore.addImplementedTypeRef(ref);
    if (typeof param !== 'string') {
      this.configStore.associateParamWithRef(param, ref);
    }

    return ref;
  }

  scalarType<Name extends ScalarName<Types>>(
    name: Name,
    options: PothosSchemaTypes.ScalarTypeOptions<
      Types,
      InputShape<Types, Name>,
      ParentShape<Types, Name>
    >,
  ): PothosSchemaTypes.ScalarRef<Types, InputShape<Types, Name>, ParentShape<Types, Name>> {
    const ref = new ScalarRef<Types, InputShape<Types, Name>, ParentShape<Types, Name>>(name);

    ref.initConfig({
      kind: 'Scalar',
      graphqlKind: 'Scalar',
      name,
      description: options.description,
      parseLiteral: options.parseLiteral,
      parseValue: options.parseValue,
      serialize: options.serialize as GraphQLScalarSerializer<OutputShape<Types, Name>>,
      pothosOptions: options as unknown as PothosSchemaTypes.ScalarTypeOptions,
      extensions: options.extensions,
    });

    this.configStore.addImplementedTypeRef(ref);

    return ref;
  }

  addScalarType<Name extends ScalarName<Types>>(
    name: Name,
    scalar: GraphQLScalarType,
    options: Omit<
      PothosSchemaTypes.ScalarTypeOptions<Types, InputShape<Types, Name>, OutputShape<Types, Name>>,
      'serialize'
    > & {
      serialize?: GraphQLScalarSerializer<OutputShape<Types, Name>>;
    },
  ) {
    const config = scalar.toConfig();

    return this.scalarType<Name>(name, {
      ...config,
      ...options,
      extensions: {
        ...config.extensions,
        ...options.extensions,
      },
    } as PothosSchemaTypes.ScalarTypeOptions<Types, InputShape<Types, Name>, ParentShape<Types, Name>>);
  }

  inputType<
    Param extends InputObjectRef<Types, unknown> | string,
    Fields extends Param extends PothosSchemaTypes.InputObjectRef<Types, unknown>
      ? InputFieldsFromShape<Types, InputShape<Types, Param> & {}, 'InputObject'>
      : InputFieldMap,
  >(
    param: Param,
    options: PothosSchemaTypes.InputObjectTypeOptions<Types, Fields>,
  ): PothosSchemaTypes.InputObjectRef<Types, InputShapeFromFields<Fields>> {
    verifyRef(param);
    const name = typeof param === 'string' ? param : (param as { name: string }).name;

    const ref = (
      typeof param === 'string'
        ? new InputObjectRef<Types, InputShapeFromFields<Fields>>(name)
        : param
    ) as PothosSchemaTypes.InputObjectRef<Types, InputShapeFromFields<Fields>>;

    ref.initConfig({
      kind: 'InputObject',
      graphqlKind: 'InputObject',
      name,
      description: options.description,
      pothosOptions: options as unknown as PothosSchemaTypes.InputObjectTypeOptions,
      extensions: options.extensions,
    });

    this.configStore.addImplementedTypeRef(ref);

    if (param !== ref && typeof param !== 'string') {
      this.configStore.associateParamWithRef(param, ref);
    }

    this.configStore.addInputFields(ref, () =>
      options.fields(new InputFieldBuilder('InputObject')),
    );

    return ref;
  }

  inputRef<T extends object>(name: string): ImplementableInputObjectRef<Types, T> {
    return new ImplementableInputObjectRef<Types, T>(this, name);
  }

  objectRef<T>(name: string): ImplementableObjectRef<Types, T> {
    return new ImplementableObjectRef<Types, T>(this, name);
  }

  interfaceRef<T>(name: string): ImplementableInterfaceRef<Types, T> {
    return new ImplementableInterfaceRef<Types, T>(this, name);
  }

  toSchema(...args: NormalizeArgs<[options?: PothosSchemaTypes.BuildSchemaOptions<Types>]>) {
    const [options = {}] = args;
    const { directives, extensions } = options;

    const scalars = [GraphQLID, GraphQLInt, GraphQLFloat, GraphQLString, GraphQLBoolean];

    scalars.forEach((scalar) => {
      if (!this.configStore.hasImplementation(scalar.name)) {
        this.addScalarType(scalar.name as ScalarName<Types>, scalar, {});
      }
    });

    const buildCache = new BuildCache(this, options);

    buildCache.plugin.beforeBuild();

    buildCache.buildAll();

    const builtTypes = [...buildCache.types.values()];

    const schema = new GraphQLSchema({
      query: buildCache.types.get('Query') as GraphQLObjectType | undefined,
      mutation: buildCache.types.get('Mutation') as GraphQLObjectType | undefined,
      subscription: buildCache.types.get('Subscription') as GraphQLObjectType | undefined,
      extensions: extensions ?? {},
      directives: directives as GraphQLDirective[],
      types: builtTypes,
    });

    const processedSchema = buildCache.plugin.afterBuild(schema);

    return options.sortSchema === false
      ? processedSchema
      : lexicographicSortSchema(processedSchema);
  }
}
