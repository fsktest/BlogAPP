import { GeistSans as ImportedGeistSans } from 'geist/font/sans';
import { GeistMono as ImportedGeistMono } from 'geist/font/mono';

// The GeistSans and GeistMono objects from the 'geist' package
// are already configured font objects. They include a `variable`
// property that can be used directly in `layout.tsx`.
// Options like `subsets` ('latin' is default) and `display` ('swap' is default)
// are generally pre-configured by the `geist` package.

export const geistSans = ImportedGeistSans;
export const geistMono = ImportedGeistMono;
