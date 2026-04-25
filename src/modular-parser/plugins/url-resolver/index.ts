import {
	type ResolveFn,
	type TransformFn,
} from "../../PathResolver.ts";
import { type PathResolverConfig } from "../types.ts";

export class UrlResolver<R = string> implements PathResolverConfig<R> {
	name: string;
	resolve: ResolveFn<R>;
	transform?: TransformFn<R>;
	init?: () => Promise<void> | void;

	constructor(
		name: string,
		resolve: ResolveFn<R>,
		transform?: TransformFn<R>,
		init?: () => Promise<void> | void,
	) {
		this.name = name;
		this.resolve = resolve;
		this.transform = transform;
		this.init = init;
	}
}

export function urlResolver<R = string>(
	name: string,
	resolve: ResolveFn<R>,
	transform?: TransformFn<R>,
	init?: () => Promise<void> | void,
): UrlResolver<R> {
	return new UrlResolver(name, resolve, transform, init);
}

export default new UrlResolver(
	"urlResolver",
	type:'pathResolver',
	instance: async (url) => fetch(url).then((r) => r.text()),
);
