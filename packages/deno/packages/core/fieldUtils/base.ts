// @ts-nocheck
import FieldRef from '../refs/field.ts';
import type { FieldKind, InputFieldMap, ShapeFromTypeParam } from '../types/index.ts';
import { FieldNullability, SchemaTypes, TypeParam } from '../types/index.ts';
export default class BaseFieldUtil<Types extends SchemaTypes, ParentShape, Kind extends FieldKind> {
    builder: PothosSchemaTypes.SchemaBuilder<Types>;
    kind: Kind;
    graphqlKind: PothosSchemaTypes.PothosKindToGraphQLType[Kind];
    constructor(builder: PothosSchemaTypes.SchemaBuilder<Types>, kind: Kind, graphqlKind: PothosSchemaTypes.PothosKindToGraphQLType[Kind]) {
        this.builder = builder;
        this.kind = kind;
        this.graphqlKind = graphqlKind;
    }
    protected createField<Args extends InputFieldMap, Type extends TypeParam<Types>, Nullable extends FieldNullability<Type>>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: PothosSchemaTypes.FieldOptions<Types, ParentShape, Type, Nullable, Args, any, {}>): FieldRef<Types, ShapeFromTypeParam<Types, Type, Nullable>, Kind> {
        const ref = new FieldRef<Types, ShapeFromTypeParam<Types, Type, Nullable>, Kind>(this.builder, this.kind, options as never);
        this.builder.configStore.addFieldRef(ref as FieldRef<Types, unknown, Kind>, options.type, options.args ?? {});
        return ref;
    }
    protected exposeField<Type extends TypeParam<Types>, Nullable extends FieldNullability<Type>, Name extends keyof ParentShape & string>(name: Name, { extensions, ...options }: Omit<PothosSchemaTypes.ObjectFieldOptions<Types, ParentShape, Type, Nullable, {}, {}>, "resolve">): FieldRef<Types, ShapeFromTypeParam<Types, Type, Nullable>, Kind> {
        return this.createField({
            ...options,
            extensions: {
                pothosExposedField: name,
                ...extensions,
            },
            resolve: (parent) => (parent as Record<string, never>)[name as string],
        });
    }
}
