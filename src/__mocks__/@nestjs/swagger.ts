export const ApiTags = jest.fn(() => (target: unknown) => target);
export const ApiOperation = jest.fn(
  () => (_t: unknown, _k: string, d: PropertyDescriptor) => d,
);
export const ApiResponse = jest.fn(
  () => (_t: unknown, _k: string, d: PropertyDescriptor) => d,
);
export const ApiBearerAuth = jest.fn(
  () => (_t: unknown, _k: string, d: PropertyDescriptor) => d,
);
export const ApiBody = jest.fn(
  () => (_t: unknown, _k: string, d: PropertyDescriptor) => d,
);
export const ApiProperty = jest.fn();
export const ApiPropertyOptional = jest.fn();
export const ApiHideProperty = jest.fn();
