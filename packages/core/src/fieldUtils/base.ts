import { defaultFieldResolver } from 'graphql';
import { ArgumentRef } from '../refs/arg';
import { FieldRef } from '../refs/field';
import type {
  FieldKind,
  InputFieldMap,
  PothosInputFieldConfig,
  ShapeFromTypeParam,
} from '../types';
import { FieldNullability, SchemaTypes, TypeParam } from '../types';
import { typeFromParam } from '../utils';

export class BaseFieldUtil<Types extends SchemaTypes, ParentShape, Kind extends FieldKind> {
  kind: Kind;

  graphqlKind: PothosSchemaTypes.PothosKindToGraphQLType[Kind];

  constructor(kind: Kind, graphqlKind: PothosSchemaTypes.PothosKindToGraphQLType[Kind]) {
    this.kind = kind;
    this.graphqlKind = graphqlKind;
  }

  protected createField<
    Args extends InputFieldMap,
    Type extends TypeParam<Types>,
    Nullable extends FieldNullability<Type>,
  >(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: PothosSchemaTypes.FieldOptions<Types, ParentShape, Type, Nullable, Args, any, {}>,
  ): FieldRef<Types, ShapeFromTypeParam<Types, Type, Nullable>, Kind> {
    const ref = new FieldRef<Types, ShapeFromTypeParam<Types, Type, Nullable>, Kind>(
      this.kind,
      (builder, name, typeConfig) => {
        const args: Record<string, PothosInputFieldConfig<Types>> = {};
        if (options.args) {
          Object.keys(options.args).forEach((argName) => {
            args[argName] = (options.args![argName] as ArgumentRef<Types, unknown>).getConfig(
              builder,
              argName,
              name,
              typeConfig,
            );
          });
        }

        let { resolve } = options as { resolve?: (...argList: unknown[]) => unknown };

        if (options.extensions?.pothosExposedField === name) {
          resolve = defaultFieldResolver as typeof resolve;
        }
        const { subscribe } = options as { subscribe?: (...argList: unknown[]) => unknown };
        return {
          kind: this.kind as never,
          graphqlKind: typeConfig.graphqlKind as 'Object' | 'Interface',
          parentType: typeConfig.name,
          name,
          args,
          type: typeFromParam(
            options.type,
            builder.configStore,
            options.nullable ?? builder.defaultFieldNullability,
          ),
          pothosOptions: options as never,
          extensions: {
            pothosOriginalResolve: resolve,
            pothosOriginalSubscribe: subscribe,
            ...options.extensions,
          },
          description: options.description,
          deprecationReason: options.deprecationReason,
          resolve,
          subscribe,
        };
      },
    );

    return ref;
  }

  protected exposeField<
    Type extends TypeParam<Types>,
    Nullable extends FieldNullability<Type>,
    Name extends keyof ParentShape & string,
  >(
    name: Name,
    {
      extensions,
      ...options
    }: Omit<
      PothosSchemaTypes.ObjectFieldOptions<Types, ParentShape, Type, Nullable, {}, {}>,
      'resolve'
    >,
  ): FieldRef<Types, ShapeFromTypeParam<Types, Type, Nullable>, Kind> {
    return this.createField({
      ...options,
      extensions: {
        pothosExposedField: name,
        ...extensions,
      },
      resolve: (parent) => (parent as Record<string, never>)[name as string],
    });
  }

  protected withBuilder<T>(
    define: (builder: PothosSchemaTypes.SchemaBuilder<Types>) => FieldRef<Types, T, Kind>,
  ) {
    return new FieldRef<Types, T, Kind>(this.kind, (builder, name, typeConfig) =>
      define(builder).getConfig(builder, name, typeConfig),
    );
  }
}
