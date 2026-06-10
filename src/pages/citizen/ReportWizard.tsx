import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router";
import {
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  ImagePlus,
  MapPin,
  Shield,
  Sparkles,
  Upload,
} from "lucide-react";

import { CitizenShell } from "@/components/citizen-v2/CitizenShell";
import { CitizenStatusBadge } from "@/components/citizen-v2/CitizenStatusBadge";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { useAuth } from "@/contexts/AuthContext";
import { CATEGORY_META } from "@/lib/constants";
import { createReport } from "@/lib/api";
import { env } from "@/lib/env";
import type { ReportCategory } from "@/types";

type StepState = {
  label: string;
  done: boolean;
};

const CATEGORY_OPTIONS = Object.keys(CATEGORY_META) as ReportCategory[];

function buildStepState(input: {
  photo: File | null;
  address: string;
  category: ReportCategory;
  description: string;
}): StepState[] {
  return [
    { label: "Add Photo", done: Boolean(input.photo) },
    { label: "Confirm Location", done: input.address.trim().length > 0 },
    { label: "Category", done: Boolean(input.category) },
    { label: "Add Details", done: input.description.trim().length > 0 },
    {
      label: "Submit",
      done:
        Boolean(input.photo) &&
        input.address.trim().length > 0 &&
        Boolean(input.category),
    },
  ];
}

export default function ReportWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [lat, setLat] = useState(env.defaultLat);
  const [lng, setLng] = useState(env.defaultLng);
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("Aktau");
  const [category, setCategory] = useState<ReportCategory>("road");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const steps = useMemo(
    () => buildStepState({ photo, address, category, description }),
    [photo, address, category, description],
  );
  const completedSteps = steps.filter((step) => step.done).length;
  const submitReady = Boolean(photo) && Boolean(user) && address.trim().length > 0;

  const categoryMeta = CATEGORY_META[category];

  function onPickPhoto(event: ChangeEvent<HTMLInputElement>) {
    const nextPhoto = event.target.files?.[0];
    if (!nextPhoto) return;

    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    setSubmitError(null);
    setPhoto(nextPhoto);
    setPhotoPreview(URL.createObjectURL(nextPhoto));
  }

  function onUseCurrentLocation() {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLat = position.coords.latitude;
        const nextLng = position.coords.longitude;
        setLat(nextLat);
        setLng(nextLng);
        setAddress(`${nextLat.toFixed(5)}, ${nextLng.toFixed(5)}`);
        setDistrict("Current location");
        setSubmitError(null);
      },
      () => {
        setSubmitError("Location access was denied. Enter the address manually.");
      },
    );
  }

  async function onSubmit() {
    if (!photo || !user || !address.trim()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      await createReport({
        photo,
        userCategory: category,
        description: description.trim(),
        lat,
        lng,
        address: address.trim(),
        submittedBy: user.id,
      });
      setDone(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to submit the report.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <CitizenShell
        title="Report submitted"
        subtitle="Your report was sent to CityPulse and is now available in the live citizen queue."
      >
        <div className="mx-auto mt-8 max-w-3xl">
          <article className="citizen-v2-panel flex flex-col items-center px-8 py-14 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <CheckCircle2 size={38} />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-slate-950">Your issue is now live.</h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">
              The report was uploaded successfully and will now appear in your citizen report history.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/citizen/my-reports")}
                className="rounded-2xl bg-teal-700 px-6 py-3 text-sm font-semibold text-white"
              >
                Open My Reports
              </button>
              <button
                type="button"
                onClick={() => navigate("/citizen")}
                className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700"
              >
                Back to Overview
              </button>
            </div>
          </article>
        </div>
      </CitizenShell>
    );
  }

  return (
    <CitizenShell
      title="Create New Report"
      subtitle="Help improve Aktau by reporting issues in your city."
    >
      <section className="mt-6 border-t border-slate-200/80 pt-5">
        <div className="grid gap-3 lg:grid-cols-5">
          {steps.map((step, index) => (
            <div key={step.label} className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold ${
                  step.done
                    ? "border-teal-700 bg-teal-700 text-white"
                    : "border-slate-200 bg-white text-slate-500"
                }`}
              >
                {step.done ? <Check size={16} /> : index + 1}
              </div>
              <span className="text-sm font-medium text-slate-700">{step.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_320px]">
        <div className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.18fr)]">
            <article className="citizen-v2-panel">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-950">Add Photo of the Issue</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Clear photos help city services understand and resolve issues faster.
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPickPhoto}
                />
              </div>

              <div className="mt-5">
                {photoPreview ? (
                  <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
                    <img
                      src={photoPreview}
                      alt="Selected issue"
                      className="h-[340px] w-full object-cover"
                    />
                    <div className="flex justify-center p-5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-800 px-5 py-3 text-sm font-semibold text-white"
                      >
                        <Camera size={16} />
                        Change Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-[396px] w-full flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 text-center transition hover:border-teal-400 hover:bg-teal-50/40"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-teal-700 shadow-sm">
                      <ImagePlus size={28} />
                    </div>
                    <p className="mt-5 text-lg font-semibold text-slate-900">Upload a photo</p>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                      Add one photo that clearly shows the issue. The report will use this image as the live reference.
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
                      <Upload size={16} />
                      Choose image
                    </span>
                  </button>
                )}
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-[20px] bg-emerald-50 px-4 py-4 text-emerald-800">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">
                    {photo ? "Photo added successfully" : "Photo required"}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-emerald-700/90">
                    {photo
                      ? "Your upload is ready for submission."
                      : "Add a photo before submitting the report."}
                  </p>
                </div>
              </div>
            </article>

            <div className="space-y-5">
              <article className="citizen-v2-panel">
                <h2 className="text-2xl font-semibold text-slate-950">Confirm Location</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Confirm where the issue is located. You can use your current location or enter the address manually.
                </p>

                <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
                  <div className="flex h-[170px] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.12),transparent_42%),linear-gradient(135deg,#eef6f4_0%,#f8fafc_45%,#edf4fb_100%)]">
                    <div className="rounded-full bg-white p-4 text-teal-700 shadow-sm">
                      <MapPin size={24} />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 rounded-full bg-blue-50 p-2 text-blue-600">
                        <MapPin size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {address || "No address selected yet"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">{district}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onUseCurrentLocation}
                      className="text-sm font-semibold text-teal-700"
                    >
                      Use current location
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-700">Address</span>
                    <input
                      value={address}
                      onChange={(event) => {
                        setAddress(event.target.value);
                        setDistrict("Aktau");
                        setSubmitError(null);
                      }}
                      placeholder="Abay Ave. 52, Aktau"
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-500"
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-slate-700">Latitude</span>
                      <input
                        value={lat}
                        onChange={(event) => setLat(Number(event.target.value))}
                        type="number"
                        step="0.00001"
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-500"
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-slate-700">Longitude</span>
                      <input
                        value={lng}
                        onChange={(event) => setLng(Number(event.target.value))}
                        type="number"
                        step="0.00001"
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-500"
                      />
                    </label>
                  </div>
                </div>
              </article>

              <article className="citizen-v2-panel">
                <h2 className="text-2xl font-semibold text-slate-950">Issue Category</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Choose the category that best describes the issue you are reporting.
                </p>

                <div className="mt-5 rounded-[24px] bg-emerald-50/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className="mt-1 h-11 w-11 rounded-2xl"
                        style={{ backgroundColor: `${categoryMeta.color}18` }}
                      >
                        <div
                          className="m-2 h-7 w-7 rounded-xl"
                          style={{ backgroundColor: categoryMeta.color }}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {categoryMeta.label}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          This label will be stored with the report and used for clustering.
                        </p>
                      </div>
                    </div>
                    <CitizenStatusBadge label="Live category" tone="success" />
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {CATEGORY_OPTIONS.map((option) => {
                    const meta = CATEGORY_META[option];
                    const active = option === category;

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setCategory(option)}
                        className={`rounded-[22px] border px-4 py-4 text-left transition ${
                          active
                            ? "border-teal-600 bg-teal-50 shadow-sm"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: meta.color }}
                            />
                            <span className="text-sm font-semibold text-slate-900">
                              {meta.label}
                            </span>
                          </div>
                          {active ? <Check size={16} className="text-teal-700" /> : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </article>

              <article className="citizen-v2-panel">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-950">Add Details</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Add context that would help city teams respond faster.
                    </p>
                  </div>
                  <span className="text-sm font-medium text-slate-400">
                    {description.length}/280
                  </span>
                </div>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value.slice(0, 280))}
                  rows={4}
                  placeholder="Example: Street light has been off for three nights and the area is very dark after sunset."
                  className="mt-5 w-full rounded-[22px] border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-700 outline-none transition focus:border-teal-500"
                />
              </article>
            </div>
          </div>

          <section className="grid gap-4 md:grid-cols-3">
            <article className="citizen-v2-panel">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                  <Shield size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Private & Secure</p>
                  <p className="mt-1 text-sm text-slate-500">Your report information is protected.</p>
                </div>
              </div>
            </article>
            <article className="citizen-v2-panel">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Verified & Transparent</p>
                  <p className="mt-1 text-sm text-slate-500">Reports are reviewed and shared live.</p>
                </div>
              </div>
            </article>
            <article className="citizen-v2-panel">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                  <Sparkles size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Track in Real Time</p>
                  <p className="mt-1 text-sm text-slate-500">Follow your report from submission to resolution.</p>
                </div>
              </div>
            </article>
          </section>
        </div>

        <aside className="space-y-5">
          <article className="citizen-v2-panel sticky top-6">
            <h2 className="text-2xl font-semibold text-slate-950">Review Your Report</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Review the details before submitting the live report.
            </p>

            <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Issue preview"
                  className="h-48 w-full object-cover"
                />
              ) : (
                <div className="flex h-48 items-center justify-center text-sm font-medium text-slate-400">
                  Add a photo to preview the report
                </div>
              )}
            </div>

            <div className="mt-5 space-y-5">
              <div className="border-b border-slate-200 pb-4">
                <p className="text-sm font-semibold text-slate-900">Location</p>
                <p className="mt-2 text-sm text-slate-700">
                  {address || "Address not provided"}
                </p>
                <p className="mt-1 text-sm text-slate-500">{district}</p>
              </div>

              <div className="border-b border-slate-200 pb-4">
                <p className="text-sm font-semibold text-slate-900">Category</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <CategoryBadge category={category} />
                  <span className="text-sm font-medium text-slate-500">
                    {completedSteps}/5 complete
                  </span>
                </div>
              </div>

              <div className="border-b border-slate-200 pb-4">
                <p className="text-sm font-semibold text-slate-900">Details</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {description.trim() || "No extra details added yet."}
                </p>
              </div>
            </div>

            {submitError ? (
              <div className="mt-5 rounded-[20px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {submitError}
              </div>
            ) : null}

            <button
              type="button"
              onClick={onSubmit}
              disabled={!submitReady || submitting}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-700 px-5 py-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Submitting report..." : "Submit Report"}
              <ChevronRight size={16} />
            </button>

            <p className="mt-4 text-center text-sm text-slate-500">
              Your report is private and secure.
            </p>
          </article>
        </aside>
      </div>
    </CitizenShell>
  );
}
