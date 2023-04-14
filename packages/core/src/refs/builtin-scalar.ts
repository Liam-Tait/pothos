import { GraphQLScalarType } from 'graphql';
import { SchemaTypes } from '../types';
import ScalarRef from './scalar';

export default class BuiltinScalarRef<Types extends SchemaTypes, T, U> extends ScalarRef<
  Types,
  T,
  U
> {
  type;

  constructor(builder: PothosSchemaTypes.SchemaBuilder<Types>, type: GraphQLScalarType) {
    super(builder, type.name);

    this.type = type;
  }
}
