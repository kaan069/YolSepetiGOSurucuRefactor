export interface FkSelectOption<T extends string | number = string> {
  value: T;
  label: string;
  icon?: string;
  description?: string;
  disabled?: boolean;
}
