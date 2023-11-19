// @ts-nocheck
import { inputShapeKey } from '../types/index.ts';
import BaseTypeRef from './base.ts';
export default class InputTypeRef<T> extends BaseTypeRef {
    override kind;
    $inferInput!: T;
    [inputShapeKey]!: T;
    constructor(kind: "Enum" | "InputObject" | "Scalar", name: string) {
        super(kind, name);
        this.kind = kind;
    }
}
