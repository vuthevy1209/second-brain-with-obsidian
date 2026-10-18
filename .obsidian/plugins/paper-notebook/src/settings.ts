import { App, PluginSettingTab, Setting } from "obsidian";
import { Template, TEMPLATES } from "./model";
import type PaperNotebookPlugin from "./main";

export interface PaperNotebookSettings {
  defaultTemplate: Template;
  showSidebar: boolean;
  /** In số trang ở chân mỗi trang giấy (cả trên PDF) */
  showPageNumbers: boolean;
  /** Thư mục lưu PDF, để trống = cùng thư mục với notebook */
  exportFolder: string;
  openPdfAfterExport: boolean;
}

export const DEFAULT_SETTINGS: PaperNotebookSettings = {
  defaultTemplate: "lined",
  showSidebar: true,
  showPageNumbers: true,
  exportFolder: "",
  openPdfAfterExport: true,
};

export class PaperNotebookSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: PaperNotebookPlugin) {
    super(app, plugin);
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    const s = this.plugin.settings;

    new Setting(containerEl)
      .setName("Mẫu giấy mặc định")
      .setDesc("Dùng cho trang đầu tiên của notebook mới.")
      .addDropdown((d) => {
        for (const t of TEMPLATES) d.addOption(t.id, t.label);
        d.setValue(s.defaultTemplate).onChange(async (v) => {
          s.defaultTemplate = v as Template;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("Đánh số trang")
      .setDesc("In số thứ tự ở chân mỗi trang giấy, export PDF cũng có.")
      .addToggle((t) =>
        t.setValue(s.showPageNumbers).onChange(async (v) => {
          s.showPageNumbers = v;
          await this.plugin.saveSettings();
          this.plugin.refreshPageNumbers();
        })
      );

    new Setting(containerEl)
      .setName("Thư mục lưu PDF")
      .setDesc("Để trống thì PDF nằm cạnh file notebook.")
      .addText((t) =>
        t
          .setPlaceholder("Ví dụ: 05-Archive/PDF")
          .setValue(s.exportFolder)
          .onChange(async (v) => {
            s.exportFolder = v.trim().replace(/^\/+|\/+$/g, "");
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Mở PDF sau khi export")
      .addToggle((t) =>
        t.setValue(s.openPdfAfterExport).onChange(async (v) => {
          s.openPdfAfterExport = v;
          await this.plugin.saveSettings();
        })
      );
  }
}
