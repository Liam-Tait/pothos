import { SchemaTypes } from '../types';
import { FieldBuilder } from './builder';

export class InterfaceFieldBuilder<Types extends SchemaTypes, ParentShape> extends FieldBuilder<
  Types,
  ParentShape,
  'Interface'
> {
  constructor() {
    super('Interface', 'Interface');
  }
}
