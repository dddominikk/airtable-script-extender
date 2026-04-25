import {
  type ResolveFn,
  type TransformFn,
} from '../../PathResolver.ts';
import { type PathResolverConfig } from '../types.ts';

export class UrlResolver<R = string> implements PathResolverConfig<R> {
  name:       string;
  resolve:    ResolveFn<R>;
  transform?: TransformFn<R>;

  constructor(name: string, resolve: ResolveFn<R>, transform?: TransformFn<R>) {
    this.name      = name;
    this.resolve   = resolve;
    this.transform = transform;
  }
}

export function urlResolver<R = string>(
  name:       string,
  resolve:    ResolveFn<R>,
  transform?: TransformFn<R>,
): UrlResolver<R> {
  return new UrlResolver(name, resolve, transform);
}

export default new UrlResolver(
  'urlResolver',
  async (url) => fetch(url).then((r) => r.text()),
);
