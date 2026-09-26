declare module 'bcryptjs' {
  export function hash(s: string, saltOrRounds: number | string): Promise<string>;
  export function compare(s: string, hash: string): Promise<boolean>;
  export function genSaltSync(rounds?: number): string;
  export function hashSync(s: string, salt: string): string;
  export function compareSync(s: string, hash: string): boolean;
  const bcrypt: any;
  export default bcrypt;
}
