import { around } from "monkey-around";
import { ViewState, WorkspaceLeaf } from "obsidian";
import { isNotebookPath } from "./format";
import { VIEW_TYPE } from "./view";

/**
 * Obsidian coi `x.notebook.md` là file markdown (đuôi `md`), nên không đăng ký
 * extension riêng được. Thay vào đó, mỗi khi một leaf định mở file đó bằng view
 * markdown thì đổi sang view notebook — trừ khi người dùng chủ động chọn
 * "Mở dạng markdown" cho đúng file đó trong leaf đó.
 */
export function installOpenPatch(rawLeaves: WeakMap<WorkspaceLeaf, string>) {
  return around(WorkspaceLeaf.prototype, {
    setViewState(next) {
      return function (this: WorkspaceLeaf, state: ViewState, eState?: any) {
        const file = state?.state?.file;
        if (state?.type === "markdown" && typeof file === "string" && isNotebookPath(file)) {
          if (rawLeaves.get(this) !== file) {
            rawLeaves.delete(this);
            state = { ...state, type: VIEW_TYPE };
          }
        }
        return next.call(this, state, eState);
      };
    },
  });
}
