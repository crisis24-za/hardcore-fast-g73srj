import React, { useState, useMemo, useRef, useEffect } from "react";
import { Database, User, Bell, AlertCircle } from "lucide-react";
/*────────────────────────  DATA  ────────────────────────*/
const modulesSeed = [
  /* Edit Profile */
  {
    id: "edit-profile",
    name: "Edit Profile",
    icon: User,
    fields: [
      { id: "full-name", name: "Full Name", syncsTo: [] },
      {
        id: "display-name",
        name: "Display Name",
        syncsTo: ["notifications:display-name", "profile-dataset:display-name"],
      },
      { id: "email", name: "Email", readOnly: true, syncsTo: [] },
      {
        id: "phone-number",
        name: "Phone Number",
        syncsTo: ["notifications:work-phone", "profile-dataset:work-phone"],
      },
      { id: "language", name: "Language", syncsTo: ["notifications:language"] },
      {
        id: "unit-distance",
        name: "Unit of Distance",
        syncsTo: [
          "notifications:unit-distance",
          "profile-dataset:unit-distance",
        ],
      },
      {
        id: "timezone",
        name: "Timezone",
        syncsTo: ["notifications:timezone", "profile-dataset:timezone"],
      },
      {
        id: "24-hour-time",
        name: "24-Hour Time",
        syncsTo: ["notifications:24-hour-time", "profile-dataset:24-hour-time"],
      },
      {
        id: "change-photo",
        name: "Change Photo",
        syncsTo: ["notifications:change-photo", "profile-dataset:change-photo"],
      },
    ],
  },
  /* Notification Preferences Portal */
  {
    id: "notifications",
    name: "Notification Preferences Portal",
    icon: Bell,
    fields: [
      {
        id: "display-name",
        name: "Display Name",
        syncsTo: ["profile-dataset:display-name"],
      },
      {
        id: "work-phone",
        name: "Work Phone",
        syncsTo: ["profile-dataset:work-phone"],
      },
      {
        id: "personal-phone",
        name: "Personal Phone",
        syncsTo: ["profile-dataset:personal-phone"],
      },
      { id: "language", name: "Language", syncsTo: [] },
      {
        id: "unit-distance",
        name: "Unit of Distance",
        syncsTo: ["profile-dataset:unit-distance"],
      },
      {
        id: "timezone",
        name: "Timezone",
        syncsTo: ["profile-dataset:timezone"],
      },
      {
        id: "24-hour-time",
        name: "24-Hour Time",
        syncsTo: ["profile-dataset:24-hour-time"],
      },
      {
        id: "change-photo",
        name: "Change Photo",
        syncsTo: ["profile-dataset:change-photo"],
      },
      { id: "work-email", name: "Work Email", readOnly: true, syncsTo: [] },
    ],
  },
  /* Profile Preferences Dataset */
  {
    id: "profile-dataset",
    name: "Profile Preferences Dataset",
    icon: Database,
    fields: [
      {
        id: "display-name",
        name: "Display Name",
        syncsTo: ["notifications:display-name"],
      },
      {
        id: "work-email",
        name: "Work Email",
        syncsTo: ["notifications:work-email"],
      },
      {
        id: "work-phone",
        name: "Work Phone",
        syncsTo: ["notifications:work-phone"],
      },
      {
        id: "personal-phone",
        name: "Personal Phone",
        syncsTo: ["notifications:personal-phone"],
      },
      {
        id: "unit-distance",
        name: "Unit of Distance",
        syncsTo: ["notifications:unit-distance"],
      },
      { id: "timezone", name: "Timezone", syncsTo: ["notifications:timezone"] },
      {
        id: "24-hour-time",
        name: "24-Hour Time",
        syncsTo: ["notifications:24-hour-time"],
      },
      {
        id: "change-photo",
        name: "Avatar Image",
        syncsTo: ["notifications:change-photo"],
      },
    ],
  },
];
/* fast lookup */
const makeMap = (mods) => {
  const m = {};
  mods.forEach((mod) =>
    mod.fields.forEach(
      (f) => (m[`${mod.id}:${f.id}`] = { module: mod, field: f })
    )
  );
  return m;
};
export default function FieldSyncVisualizer() {
  const [modules] = useState(modulesSeed);
  const [selected, setSelected] = useState(null);
  const fm = useMemo(() => makeMap(modules), [modules]);
  const rowRefs = useRef({});
  const flows = (a, b) => fm[a]?.field.syncsTo.includes(b);
  const status = (m, f) =>
    !selected
      ? null
      : selected.moduleId === m && selected.fieldId === f
      ? "src"
      : flows(`${selected.moduleId}:${selected.fieldId}`, `${m}:${f}`)
      ? "tgt"
      : selected.fieldId === f
      ? "wont"
      : null;
  /*──────── auto-scroll rows & banners ────────*/
  useEffect(() => {
    if (!selected) return;
    const sel = `${selected.moduleId}:${selected.fieldId}`;
    const targets = new Set([sel, ...fm[sel].field.syncsTo]);
    modules.forEach((m) => {
      targets.add(`${m.id}:${selected.fieldId}`);
      if (!m.fields.some((f) => f.id === selected.fieldId))
        targets.add(`${m.id}:__missing__`);
    });
    targets.forEach((p) =>
      rowRefs.current[p]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    );
  }, [selected, fm, modules]);
  /*──────── panel lists (unchanged logic) ────────*/
  const lists = useMemo(() => {
    if (!selected) return { will: [], wont: [], missing: [] };
    const sel = `${selected.moduleId}:${selected.fieldId}`;
    const src = selected.moduleId;
    const will = fm[sel].field.syncsTo.map(
      (p) => `${fm[p].module.name} → ${fm[p].field.name}`
    );
    const wont = modules
      .filter(
        (m) =>
          m.id !== src &&
          m.fields.some((f) => f.id === selected.fieldId) &&
          !fm[sel].field.syncsTo.some((p) => p.startsWith(m.id + ":"))
      )
      .map((m) => m.name);
    const miss = modules
      .filter((m) => !m.fields.some((f) => f.id === selected.fieldId))
      .map((m) => m.name);
    return { will, wont, missing: miss };
  }, [selected, fm, modules]);
  const roNotice =
    selected && fm[`${selected.moduleId}:${selected.fieldId}`].field.readOnly
      ? `⚠ This field is read-only in ${
          fm[`${selected.moduleId}:${selected.fieldId}`].module.name
        }; you cannot edit it here.`
      : null;
  /*───────────────────────── UI ─────────────────────────*/
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Field Sync Visualizer</h1>
      {/* Legend (read-only pill removed) */}
      <div className="mb-6 flex flex-wrap gap-4 text-sm">
        <Legend color="bg-yellow-100 border-yellow-400">Selected field</Legend>
        <Legend color="bg-green-50  border-green-300">Syncs to module</Legend>
        <Legend color="bg-red-50    border-red-300">
          Field exists – NOT linked
        </Legend>
        <Legend color="bg-gray-100  border-gray-300 text-gray-800">
          Banner: field NOT present
        </Legend>
      </div>
      {/* Columns */}
      <div className="grid lg:grid-cols-3 gap-6">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <div key={mod.id} className="bg-white border rounded shadow-sm">
              <div className="px-6 py-3 border-b bg-gray-50 flex items-center gap-2">
                <Icon className="w-5 h-5 text-gray-600" />
                <h2 className="font-semibold">{mod.name}</h2>
              </div>
              <div className="px-6 py-4 space-y-3 max-h-96 overflow-y-auto">
                {mod.fields.map((f) => {
                  const st = status(mod.id, f.id);
                  const base =
                    "p-3 border rounded cursor-pointer transition-colors";
                  const cls =
                    st === "src"
                      ? `${base} bg-yellow-100 ring-2 ring-yellow-400`
                      : st === "tgt"
                      ? `${base} bg-green-50 ring ring-green-300`
                      : st === "wont"
                      ? `${base} bg-red-50   ring ring-red-300`
                      : `${base} hover:bg-gray-100`;
                  const path = `${mod.id}:${f.id}`;
                  return (
                    <div
                      key={f.id}
                      ref={(el) => (rowRefs.current[path] = el)}
                      className={cls}
                      onClick={() =>
                        setSelected({ moduleId: mod.id, fieldId: f.id })
                      }
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium flex items-center gap-2">
                          {f.name}
                          {f.readOnly && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 border border-gray-400 text-gray-800 uppercase">
                              Read-only
                            </span>
                          )}
                        </span>
                        {f.syncsTo.length ? (
                          <span className="text-xs text-gray-500">
                            {f.syncsTo.length} sync
                            {f.syncsTo.length > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                        )}
                      </div>
                    </div>
                  );
                })}
                {/* gray banner */}
                {selected &&
                  !mod.fields.some((f) => f.id === selected.fieldId) && (
                    <div
                      ref={(el) =>
                        (rowRefs.current[`${mod.id}:__missing__`] = el)
                      }
                      className="p-3 border border-gray-300 bg-gray-100 text-sm text-gray-800 rounded"
                    >
                      Field NOT present here
                    </div>
                  )}
              </div>
            </div>
          );
        })}
      </div>
      {/* Info panel */}
      {selected && (
        <div className="mt-8 p-4 border rounded bg-blue-50">
          {roNotice ? (
            <p className="text-sm text-gray-800">{roNotice}</p>
          ) : (
            <>
              <h3 className="font-semibold mb-2">
                When you update “
                {fm[`${selected.moduleId}:${selected.fieldId}`].field.name}” in{" "}
                {fm[`${selected.moduleId}:${selected.fieldId}`].module.name}
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>
                  <span className="font-medium">System updates →</span>{" "}
                  {lists.will.length ? lists.will.join(", ") : "(none)"}
                </li>
                <li>
                  <span className="font-medium">
                    Field exists but is NOT connected →
                  </span>{" "}
                  {lists.wont.length ? lists.wont.join(", ") : "(none)"}
                </li>
                <li>
                  <span className="font-medium">Field is NOT part of →</span>{" "}
                  {lists.missing.length ? lists.missing.join(", ") : "(none)"}
                </li>
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
/* Legend helper */
function Legend({ color, children }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block w-4 h-4 border ${color} rounded`}></span>
      {children}
    </div>
  );
}
