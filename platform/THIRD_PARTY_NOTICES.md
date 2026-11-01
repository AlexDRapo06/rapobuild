# Third-party notices

The admin dashboard (`admin/src/components/`) includes code adapted from these
projects. Their licenses require keeping the notices below.

## ReUI (MIT)

`admin/src/components/ui/{avatar,badge,button,dropdown-menu,input,label,separator,sheet,sidebar,skeleton,spinner,tooltip}.tsx`
and `admin/src/hooks/use-mobile.ts`, from https://github.com/keenthemes/reui
(themselves built on shadcn/ui).

> MIT License. Copyright (c) 2025 Keenthemes Inc.

## shadcn/ui (MIT)

`admin/src/components/ui/{card,table,native-select}.tsx` follow shadcn/ui's components,
https://github.com/shadcn-ui/ui.

> MIT License. Copyright (c) 2023 shadcn.

## Magic UI (MIT)

`admin/src/components/magicui/{animated-circular-progress-bar,blur-fade,border-beam,dot-pattern,number-ticker}.tsx`,
from https://github.com/magicuidesign/magicui. `animated-circular-progress-bar` gained a `%` sign and an optional label.

> MIT License. Copyright (c) Magic UI.

---

The full MIT license text for each:

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Not included

React Bits and Animate UI use "MIT + Commons Clause", which is outside the Build
Agreement's license list (MIT, Apache, BSD, ISC), so no code from them is in
this repo. The sidebar's gliding highlight follows Animate UI's interaction
pattern but is written from scratch with `motion` (MIT). Spectrum UI (Apache-2.0)
informed the stat-card layout; no code was copied.
