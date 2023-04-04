import { SchemaTypes } from '../types';
import FieldBuilder from './builder';

export default class InterfaceFieldBuilder<
  Types extends SchemaTypes,
  ParentShape,
> extends FieldBuilder<Types, ParentShape, 'Interface'> {
  constructor(builder: PothosSchemaTypes.SchemaBuilder<Types>) {
    super(builder, 'Interface', 'Interface');
  }
}
