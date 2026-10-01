// The original project has no @types/react dependency. Keep React's special
// reconciliation key available to JSX without adding a runtime or package.
declare namespace JSX {
  interface IntrinsicAttributes { key?: string | number }
}
