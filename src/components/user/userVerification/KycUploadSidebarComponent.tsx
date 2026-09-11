import React, { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Upload, FileText, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import { KYC_UPLOAD_SIDEBAR_FALLBACK } from '@/fallbacks/user/userVerification/kycUploadSidebarFallbacks';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_FILE_TYPES = [
    'application/pdf',
    'image/png',
    'image/jpeg',
];

// Helper to validate single file
const fileSchema = z
    .custom<FileList | File[] | File>((val) => {
        if (!val) return false;
        if (val instanceof FileList) return val.length > 0;
        if (Array.isArray(val)) return val.length > 0;
        return val instanceof File;
    }, { message: 'Document is required' })
    .refine((val) => {
        const file = val instanceof FileList ? val[0] : Array.isArray(val) ? val[0] : val;
        return file && file.size <= MAX_FILE_SIZE;
    }, { message: 'File size must not exceed 5 MB' })
    .refine((val) => {
        const file = val instanceof FileList ? val[0] : Array.isArray(val) ? val[0] : val;
        return file && ACCEPTED_FILE_TYPES.includes(file.type);
    }, { message: 'Only .pdf, .png, .jpg and .jpeg formats are allowed' });

// ── Zod Schema ──────────────────────────────────────────────────────────────
const kycUploadSchema = z.object({
    poaDocument: fileSchema,
    poiDocument: fileSchema,
});

type KycUploadFormData = z.infer<typeof kycUploadSchema>;

interface KycUploadSidebarComponentProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadSuccess?: (data: { poaName: string; poiName: string }) => void;
}

export default function KycUploadSidebarComponent({
    isOpen,
    onClose,
    onUploadSuccess,
}: KycUploadSidebarComponentProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<KycUploadFormData>({
        resolver: zodResolver(kycUploadSchema),
        mode: 'onChange',
    });

    // Watch files to display file names when selected
    const watchedPoa = watch('poaDocument');
    const watchedPoi = watch('poiDocument');

    const getFileName = (fileInput: FileList | File[] | File | null | undefined): string | null => {
        if (!fileInput) return null;

        if (fileInput instanceof FileList) {
            const file = fileInput[0];
            return file ? file.name : null;
        }

        if (Array.isArray(fileInput)) {
            const file = fileInput[0];
            return file ? file.name : null;
        }

        if (fileInput instanceof File) return fileInput.name;
        return null;
    };

    const poaFileName = getFileName(watchedPoa);
    const poiFileName = getFileName(watchedPoi);

    // Lock background scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleFormSubmit: SubmitHandler<KycUploadFormData> = async (formData) => {
        try {
            setIsSubmitting(true);
            const poaFile = formData.poaDocument instanceof FileList ? formData.poaDocument[0] : formData.poaDocument;
            const poiFile = formData.poiDocument instanceof FileList ? formData.poiDocument[0] : formData.poiDocument;

            // Simulate API request delay
            await new Promise((res) => setTimeout(res, 1200));

            toast.success('KYC documents submitted successfully.');
            if (onUploadSuccess) {
                onUploadSuccess({
                    poaName: (poaFile as File)?.name || 'Proof_of_Address.pdf',
                    poiName: (poiFile as File)?.name || 'Proof_of_Identity.pdf',
                });
            }
            reset();
            onClose();
        } catch {
            toast.error('Failed to submit KYC documents. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
                onClick={handleClose}
            />

            {/* Right Drawer Panel */}
            <div className="relative z-10 w-full max-w-md h-full bg-[var(--bg-surface)] border-l border-[var(--line)] shadow-2xl flex flex-col justify-between overflow-y-auto animate-[slideInRight_0.25s_ease-out]">
                <style>{`
                    @keyframes slideInRight {
                        from { transform: translateX(100%); }
                        to { transform: translateX(0); }
                    }
                `}</style>

                {/* Sidebar Header */}
                <div className="p-6! border-b border-[var(--line)] flex items-center justify-between bg-[var(--bg-subtle)]">
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--ink)] tracking-normal">
                            {KYC_UPLOAD_SIDEBAR_FALLBACK.title}
                        </h3>
                        <p className="text-xs text-[var(--mute)] mt-1!">
                            Upload Proof of Address (POA) and Proof of Identity (POI)
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="p-1.5 rounded-lg text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                        aria-label="Close sidebar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form
                    id="kycUploadSidebar-form"
                    noValidate
                    onSubmit={handleSubmit(handleFormSubmit)}
                    className="p-6! flex-1 flex flex-col gap-6"
                >
                    <div className="p-3.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--line)] text-xs text-[var(--ink-soft)] leading-relaxed">
                        {KYC_UPLOAD_SIDEBAR_FALLBACK.description}
                    </div>

                    {/* Proof of Address (POA) Input */}
                    <div className="flex flex-col gap-2">
                        <label
                            htmlFor="kycUpload-poa"
                            className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]"
                        >
                            {KYC_UPLOAD_SIDEBAR_FALLBACK.poaLabel} <span className="text-[var(--danger)]">*</span>
                        </label>

                        <div className="relative border-2 border-dashed border-[var(--line-strong)] hover:border-[var(--gold)] rounded-xl p-4 bg-[var(--bg-subtle)] transition-colors text-center cursor-pointer flex flex-col items-center justify-center gap-2">
                            <input
                                id="kycUpload-poa"
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={(e) => {
                                    if (e.target.files) {
                                        setValue('poaDocument', e.target.files, { shouldValidate: true });
                                    }
                                }}
                            />
                            {poaFileName ? (
                                <div className="flex items-center gap-2 text-xs font-medium text-[var(--ok)]">
                                    <CheckCircle className="w-4 h-4 shrink-0" />
                                    <span className="truncate max-w-[240px]">{poaFileName}</span>
                                </div>
                            ) : (
                                <>
                                    <Upload className="w-6 h-6 text-[var(--mute)]" />
                                    <span className="text-xs text-[var(--ink-soft)] font-medium">
                                        Click or drag POA file here
                                    </span>
                                    <span className="text-[10px] text-[var(--mute)]">PDF, PNG, JPG, JPEG up to 5MB</span>
                                </>
                            )}
                        </div>
                        {errors.poaDocument && (
                            <p className="text-xs text-[var(--danger)] mt-0.5!">
                                {errors.poaDocument.message as string}
                            </p>
                        )}
                    </div>

                    {/* Proof of Identity (POI) Input */}
                    <div className="flex flex-col gap-2">
                        <label
                            htmlFor="kycUpload-poi"
                            className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]"
                        >
                            {KYC_UPLOAD_SIDEBAR_FALLBACK.poiLabel} <span className="text-[var(--danger)]">*</span>
                        </label>

                        <div className="relative border-2 border-dashed border-[var(--line-strong)] hover:border-[var(--gold)] rounded-xl p-4 bg-[var(--bg-subtle)] transition-colors text-center cursor-pointer flex flex-col items-center justify-center gap-2">
                            <input
                                id="kycUpload-poi"
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={(e) => {
                                    if (e.target.files) {
                                        setValue('poiDocument', e.target.files, { shouldValidate: true });
                                    }
                                }}
                            />
                            {poiFileName ? (
                                <div className="flex items-center gap-2 text-xs font-medium text-[var(--ok)]">
                                    <CheckCircle className="w-4 h-4 shrink-0" />
                                    <span className="truncate max-w-[240px]">{poiFileName}</span>
                                </div>
                            ) : (
                                <>
                                    <FileText className="w-6 h-6 text-[var(--mute)]" />
                                    <span className="text-xs text-[var(--ink-soft)] font-medium">
                                        Click or drag POI file here
                                    </span>
                                    <span className="text-[10px] text-[var(--mute)]">PDF, PNG, JPG, JPEG up to 5MB</span>
                                </>
                            )}
                        </div>
                        {errors.poiDocument && (
                            <p className="text-xs text-[var(--danger)] mt-0.5!">
                                {errors.poiDocument.message as string}
                            </p>
                        )}
                    </div>
                </form>

                {/* Footer Buttons */}
                <div className="p-6! border-t border-[var(--line)] bg-[var(--bg-subtle)] flex items-center justify-end gap-3">
                    <div className="w-[100px] h-[38px]">
                        <CustomButtonComponent
                            id="kycUploadSidebar-cancel-btn"
                            label="Cancel"
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="w-[140px] h-[38px]">
                        <CustomButtonComponent
                            id="kycUploadSidebar-submit-btn"
                            label="Submit KYC"
                            type="submit"
                            form="kycUploadSidebar-form"
                            variant="navy"
                            showButtonLoader={isSubmitting}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
