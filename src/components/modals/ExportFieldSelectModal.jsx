import React, { useState, useEffect } from "react";
import { Modal, Checkbox, Button, Divider, Tag } from "antd";
import { DownloadOutlined, LoadingOutlined } from "@ant-design/icons";

// Generic field-selection-before-export modal. Pass fieldGroups as:
// [{ label, color, fields: [{ key, label }] }, ...]
// onExport receives the array of selected field keys.
export default function ExportFieldSelectModal({
  open,
  onClose,
  onExport,
  isExporting,
  fieldGroups,
  title = "Select Fields to Export",
}) {
  const allFields = fieldGroups.flatMap((g) => g.fields.map((f) => f.key));
  const [selected, setSelected] = useState(() => new Set(allFields));

  useEffect(() => {
    if (open) setSelected(new Set(fieldGroups.flatMap((g) => g.fields.map((f) => f.key))));
  }, [open, fieldGroups]);

  const allChecked = selected.size === allFields.length;
  const noneChecked = selected.size === 0;

  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(allFields));

  const toggleGroup = (groupFields) => {
    const keys = groupFields.map((f) => f.key);
    const allGroupSelected = keys.every((k) => selected.has(k));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allGroupSelected) keys.forEach((k) => next.delete(k));
      else keys.forEach((k) => next.add(k));
      return next;
    });
  };

  const toggleField = (key) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <div className="flex items-center justify-between pr-4">
          <span className="text-base font-semibold">{title}</span>
          <Tag color={noneChecked ? "red" : "blue"}>
            {selected.size} / {allFields.length} selected
          </Tag>
        </div>
      }
      width={680}
      footer={
        <div className="flex justify-between items-center">
          <Checkbox checked={allChecked} indeterminate={!allChecked && !noneChecked} onChange={toggleAll}>
            <span className="font-medium">{allChecked ? "Deselect All" : "Select All"}</span>
          </Checkbox>
          <div className="flex gap-2">
            <Button onClick={onClose} disabled={isExporting}>
              Cancel
            </Button>
            <Button
              type="primary"
              icon={isExporting ? <LoadingOutlined spin /> : <DownloadOutlined />}
              onClick={() => onExport(Array.from(selected))}
              disabled={noneChecked || isExporting}
              loading={isExporting}
            >
              {isExporting ? "Exporting..." : `Export ${selected.size} Fields`}
            </Button>
          </div>
        </div>
      }
      styles={{ body: { maxHeight: "60vh", overflowY: "auto", padding: "12px 24px" } }}
    >
      <div className="flex flex-col gap-4">
        {fieldGroups.map((group) => {
          const groupKeys = group.fields.map((f) => f.key);
          const groupSelected = groupKeys.filter((k) => selected.has(k)).length;
          const allGroupChecked = groupSelected === groupKeys.length;
          const someGroupChecked = groupSelected > 0 && !allGroupChecked;

          return (
            <div key={group.label} className="border border-gray-100 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Checkbox
                  checked={allGroupChecked}
                  indeterminate={someGroupChecked}
                  onChange={() => toggleGroup(group.fields)}
                />
                <Tag color={group.color || "blue"} style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>
                  {group.label}
                </Tag>
                <span className="text-xs text-gray-400 ml-auto">
                  {groupSelected}/{groupKeys.length}
                </span>
              </div>
              <Divider style={{ margin: "6px 0" }} />
              <div className="grid grid-cols-3 gap-y-2 gap-x-3">
                {group.fields.map((field) => (
                  <Checkbox key={field.key} checked={selected.has(field.key)} onChange={() => toggleField(field.key)}>
                    <span className="text-xs">{field.label}</span>
                  </Checkbox>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
