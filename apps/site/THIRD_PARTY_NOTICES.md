# Third-party notices

## React Bits source components

- Upstream: https://github.com/DavidHDev/react-bits
- Approved immutable local snapshot: 24 source files across 14 components
- ScrollFloat provenance snapshot: commit `dbdaac1c`
- Local identifier: `LicenseRef-ReactBits-MIT-Plus-Commons-Clause-1.0`
- License text: `licenses/React-Bits-LICENSE.md`

React Bits is not treated as plain MIT. The upstream license adds a Commons Clause restriction against selling, sublicensing, or redistributing the components themselves. This course embeds the sources as part of an application; any separate redistribution of the component source requires a fresh license review.

The ASCIIText source retains its original CodePen attribution URL/comment byte-for-byte inside the approved source file.

## React and React DOM

- Packages: `react@19.2.7`, `react-dom@19.2.7`
- License: `MIT`
- Copyright (verbatim from both installed LICENSE files): Copyright (c) Meta Platforms, Inc. and affiliates.
- Installed evidence: `node_modules/react/LICENSE`, `node_modules/react-dom/LICENSE`, and the corresponding `package.json` files

## Motion

- Package: `motion@12.42.2`
- License: `MIT`
- Copyright (verbatim from the installed LICENSE): Copyright (c) 2024 [Motion](https://motion.dev) B.V.
- Installed evidence: `node_modules/motion/LICENSE.md` and `node_modules/motion/package.json`

## Three.js

- Package: `three@0.185.1`
- License: `MIT`
- Copyright (verbatim from the installed LICENSE): Copyright © 2010-2026 three.js authors
- Installed evidence: `node_modules/three/LICENSE` and `node_modules/three/package.json`

The following MIT permission and warranty text applies to React, React DOM, Motion, and Three.js:

> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all
> copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
> SOFTWARE.

## OGL

- Package: `ogl@1.0.11`
- License: `Unlicense`
- Author: Nathan Gordon
- Installed evidence: `node_modules/ogl/package.json`

The installed OGL package does not include a separate LICENSE file or a copyright line. Its package metadata identifies the author above and declares the SPDX license value `Unlicense`; this notice does not invent a different copyright statement.

## GSAP

- Package: `gsap@3.15.0`
- License/provenance: https://gsap.com/community/standard-license/

GSAP uses GreenSock's custom standard license terms. It is not recorded here as MIT; distribution and paid-feature terms must be checked again at the final packaging gate.

## IBM Plex

IBM Plex font files are not vendored by this bootstrap. If the final interface bundles them, record the exact files and their upstream provenance from https://github.com/IBM/plex and include the SIL Open Font License 1.1 text before packaging. This is a manual provenance gate, not a claim that font assets are already present.
