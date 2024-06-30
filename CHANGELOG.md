## CHANGE LOG

### 0.2.0 - 2024.06.30
#### Added
 - Support hover message for added/unadded breakpoint
  ```typescript
import { MonacoBreakpoint } from 'monaco-breakpoints'

new MonacoBreakpoints({
    ...,
    hoverMessage: {
      added: {
        value: 'hover message for added breakpoint'
      },
      unadded: {
        value: 'hover message for unadded breakpoint'
      }
    }
})
  ```

#### Changed
 - Breakpoint size from `10px` to `8px`
