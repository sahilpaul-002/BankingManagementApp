// import React, { useState, useEffect } from 'react';
// import { useForm, type SubmitHandler } from 'react-hook-form';
// import { z } from 'zod';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { X, Upload, FileText, CheckCircle } from 'lucide-react';
// import { toast } from 'react-toastify';
// import CustomButtonComponent from '@/components/common/CustomButtonComponent';
// import { KYC_UPLOAD_SIDEBAR_FALLBACK } from '@/fallbacks/user/userVerification/kycUploadSidebarFallbacks';

// const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
// const ACCEPTED_FILE_TYPES = [
//     'application/pdf',
//     'image/png',
//     'image/jpeg',
// ];

// // Helper to validate single file
// const fileSchema = z
//     .custom<FileList | File[] | File>((val) => {
//         if (!val) return false;
//         if (val instanceof FileList) return val.length > 0;
//         if (Array.isArray(val)) return val.length > 0;
//         return val instanceof File;
//     }, { message: 'Document is required' })
//     .refine((val) => {
//         const file = val instanceof FileList ? val[0] : Array.isArray(val) ? val[0] : val;
//         return file && file.size <= MAX_FILE_SIZE;
//     }, { message: 'File size must not exceed 5 MB' })
//     .refine((val) => {
//         const file = val instanceof FileList ? val[0] : Array.isArray(val) ? val[0] : val;
//         return file && ACCEPTED_FILE_TYPES.includes(file.type);
//     }, { message: 'Only .pdf, .png, .jpg and .jpeg formats are allowed' });

// // ── Zod Schema ──────────────────────────────────────────────────────────────
// const kycUploadSchema = z.object({
//     poaDocument: fileSchema,
//     poiDocument: fileSchema,
// });

// type KycUploadFormData = z.infer<typeof kycUploadSchema>;

// interface KycUploadSidebarComponentProps {
//     isOpen: boolean;
//     onClose: () => void;
//     onUploadSuccess?: (data: { poaName: string; poiName: string }) => void;
// }

// export default function KycUploadSidebarComponent({
//     isOpen,
//     onClose,
//     onUploadSuccess,
// }: KycUploadSidebarComponentProps) {
//     const [isSubmitting, setIsSubmitting] = useState(false);

//     const {
//         register,
//         handleSubmit,
//         reset,
//         watch,
//         setValue,
//         formState: { errors },
//     } = useForm<KycUploadFormData>({
//         resolver: zodResolver(kycUploadSchema),
//         mode: 'onChange',
//     });

//     // Watch files to display file names when selected
//     const watchedPoa = watch('poaDocument');
//     const watchedPoi = watch('poiDocument');

//     const getFileName = (fileInput: FileList | File[] | File | null | undefined): string | null => {
//         if (!fileInput) return null;

//         if (fileInput instanceof FileList) {
//             const file = fileInput[0];
//             return file ? file.name : null;
//         }

//         if (Array.isArray(fileInput)) {
//             const file = fileInput[0];
//             return file ? file.name : null;
//         }

//         if (fileInput instanceof File) return fileInput.name;
//         return null;
//     };

//     const poaFileName = getFileName(watchedPoa);
//     const poiFileName = getFileName(watchedPoi);

//     const handleFormSubmit: SubmitHandler<KycUploadFormData> = async (formData) => {
//         try {
//             setIsSubmitting(true);
//             const poaFile = formData.poaDocument instanceof FileList ? formData.poaDocument[0] : formData.poaDocument;
//             const poiFile = formData.poiDocument instanceof FileList ? formData.poiDocument[0] : formData.poiDocument;

//             // Simulate API request delay
//             await new Promise((res) => setTimeout(res, 1200));

//             toast.success('KYC documents submitted successfully.');
//             if (onUploadSuccess) {
//                 onUploadSuccess({
//                     poaName: (poaFile as File)?.name || 'Proof_of_Address.pdf',
//                     poiName: (poiFile as File)?.name || 'Proof_of_Identity.pdf',
//                 });
//             }
//             reset();
//             onClose();
//         } catch {
//             toast.error('Failed to submit KYC documents. Please try again.');
//         } finally {
//             setIsSubmitting(false);
//         }
//     };

//     const handleClose = () => {
//         reset();
//         onClose();
//     };

//     // Lock background scroll when drawer is open
//     useEffect(() => {
//         if (isOpen) {
//             document.body.style.overflow = 'hidden';
//         } else {
//             document.body.style.overflow = 'unset';
//         }
//         return () => {
//             document.body.style.overflow = 'unset';
//         };
//     }, [isOpen]);

//     if (!isOpen) return null;

//     return (
//         <div className="fixed inset-0 z-50 flex justify-end">
//             {/* Backdrop */}
//             <div
//                 className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
//                 onClick={handleClose}
//             />

//             {/* Right Drawer Panel */}
//             <div className="relative z-10 w-full max-w-md h-full bg-[var(--bg-surface)] border-l border-[var(--line)] shadow-2xl flex flex-col justify-between overflow-y-auto animate-[slideInRight_0.25s_ease-out]">
//                 <style>{`
//                     @keyframes slideInRight {
//                         from { transform: translateX(100%); }
//                         to { transform: translateX(0); }
//                     }
//                 `}</style>

//                 {/* Sidebar Header */}
//                 <div className="p-6! border-b border-[var(--line)] flex items-center justify-between bg-[var(--bg-subtle)]">
//                     <div>
//                         <h3 className="text-lg font-semibold text-[var(--ink)] tracking-normal">
//                             {KYC_UPLOAD_SIDEBAR_FALLBACK.title}
//                         </h3>
//                         <p className="text-xs text-[var(--mute)] mt-1!">
//                             Upload KYC Documents
//                         </p>
//                     </div>
//                     <button
//                         type="button"
//                         onClick={handleClose}
//                         className="p-1.5 rounded-lg text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
//                         aria-label="Close sidebar"
//                     >
//                         <X className="w-5 h-5" />
//                     </button>
//                 </div>

//                 {/* Form Body */}
//                 <form
//                     id="kycUploadSidebar-form"
//                     noValidate
//                     onSubmit={handleSubmit(handleFormSubmit)}
//                     className="p-6! flex-1 flex flex-col gap-6"
//                 >
//                     <div className="p-3.5! rounded-lg bg-[var(--bg-subtle)] border border-[var(--line)] text-xs text-[var(--ink-soft)] leading-relaxed">
//                         {KYC_UPLOAD_SIDEBAR_FALLBACK.description}
//                     </div>

//                     {/* Proof of Address (POA) Input */}
//                     <div className="flex flex-col gap-2">
//                         <label
//                             htmlFor="kycUpload-poa"
//                             className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]"
//                         >
//                             {KYC_UPLOAD_SIDEBAR_FALLBACK.poaLabel} <span className="text-[var(--danger)]">*</span>
//                         </label>

//                         <div className="relative border-2 border-dashed border-[var(--line-strong)] hover:border-[var(--gold)] rounded-xl p-4! bg-[var(--bg-subtle)] transition-colors text-center cursor-pointer flex flex-col items-center justify-center gap-2">
//                             <input
//                                 id="kycUpload-poa"
//                                 type="file"
//                                 accept=".pdf,.png,.jpg,.jpeg"
//                                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
//                                 onChange={(e) => {
//                                     if (e.target.files) {
//                                         setValue('poaDocument', e.target.files, { shouldValidate: true });
//                                     }
//                                 }}
//                             />
//                             {poaFileName ? (
//                                 <div className="flex items-center gap-2 text-xs font-medium text-[var(--ok)]">
//                                     <CheckCircle className="w-4 h-4 shrink-0" />
//                                     <span className="truncate max-w-[240px]">{poaFileName}</span>
//                                 </div>
//                             ) : (
//                                 <>
//                                     <Upload className="w-6 h-6 text-[var(--mute)]" />
//                                     <span className="text-xs text-[var(--ink-soft)] font-medium">
//                                         Click or drag POA file here
//                                     </span>
//                                     <span className="text-[10px] text-[var(--mute)]">PDF, PNG, JPG, JPEG up to 5MB</span>
//                                 </>
//                             )}
//                         </div>
//                         {errors.poaDocument && (
//                             <p className="text-xs text-[var(--danger)] mt-0.5!">
//                                 {errors.poaDocument.message as string}
//                             </p>
//                         )}
//                     </div>

//                     {/* Proof of Identity (POI) Input */}
//                     <div className="flex flex-col gap-2">
//                         <label
//                             htmlFor="kycUpload-poi"
//                             className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]"
//                         >
//                             {KYC_UPLOAD_SIDEBAR_FALLBACK.poiLabel} <span className="text-[var(--danger)]">*</span>
//                         </label>

//                         <div className="relative border-2 border-dashed border-[var(--line-strong)] hover:border-[var(--gold)] rounded-xl p-4! bg-[var(--bg-subtle)] transition-colors text-center cursor-pointer flex flex-col items-center justify-center gap-2">
//                             <input
//                                 id="kycUpload-poi"
//                                 type="file"
//                                 accept=".pdf,.png,.jpg,.jpeg"
//                                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
//                                 onChange={(e) => {
//                                     if (e.target.files) {
//                                         setValue('poiDocument', e.target.files, { shouldValidate: true });
//                                     }
//                                 }}
//                             />
//                             {poiFileName ? (
//                                 <div className="flex items-center gap-2 text-xs font-medium text-[var(--ok)]">
//                                     <CheckCircle className="w-4 h-4 shrink-0" />
//                                     <span className="truncate max-w-[240px]">{poiFileName}</span>
//                                 </div>
//                             ) : (
//                                 <>
//                                     <FileText className="w-6 h-6 text-[var(--mute)]" />
//                                     <span className="text-xs text-[var(--ink-soft)] font-medium">
//                                         Click or drag POI file here
//                                     </span>
//                                     <span className="text-[10px] text-[var(--mute)]">PDF, PNG, JPG, JPEG up to 5MB</span>
//                                 </>
//                             )}
//                         </div>
//                         {errors.poiDocument && (
//                             <p className="text-xs text-[var(--danger)] mt-0.5!">
//                                 {errors.poiDocument.message as string}
//                             </p>
//                         )}
//                     </div>
//                 </form>

//                 {/* Footer Buttons */}
//                 <div className="p-6! border-t border-[var(--line)] bg-[var(--bg-subtle)] flex items-center justify-end gap-3">
//                     <div className="w-fit h-fit">
//                         <CustomButtonComponent
//                             id="kycUploadSidebar-cancel-btn"
//                             label="Cancel"
//                             type="button"
//                             variant="outline"
//                             onClick={handleClose}
//                             disabled={isSubmitting}
//                         />
//                     </div>
//                     <div className="w-fit h-fit">
//                         <CustomButtonComponent
//                             id="kycUploadSidebar-submit-btn"
//                             label="Submit KYC"
//                             type="submit"
//                             form="kycUploadSidebar-form"
//                             variant="navy"
//                             showButtonLoader={isSubmitting}
//                         />
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }



import React, { useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Upload, FileText, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';

import CustomButtonComponent from '@/components/common/CustomButtonComponent';
import CustomInputComponent from '@/components/common/CustomInputComponent';
import { useUploadKycDetailsMutation } from '@/redux/features/kyc/kycApis';
import ShowInConsole from '@/utils/ShowInConsole';

interface KycUploadSidebarFallbackType {
    title: string;
    description: string;
    poaLabel: string;
    poiLabel: string;
    maxFileSizeMb: number;
    allowedFormats: string[];
}

const KYC_UPLOAD_SIDEBAR_FALLBACK: KycUploadSidebarFallbackType = {
    title: "KYC Verification Upload",
    description: "Please upload your Proof of Address (POA) and Proof of Identity (POI) documents. Files must be in PDF, PNG, JPG, or JPEG format and under 5 MB.",
    poaLabel: "Proof of Address (POA)",
    poiLabel: "Proof of Identity (POI)",
    maxFileSizeMb: 5,
    allowedFormats: ["PDF", "PNG", "JPG", "JPEG"],
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ACCEPTED_FILE_TYPES = [
    'application/pdf',
    'image/png',
    'image/jpeg',
];

const fileSchema = z
    .custom<FileList>(
        (value) => value instanceof FileList && value.length > 0,
        {
            message: 'Document is required',
        }
    )
    .refine(
        (value) => {
            const file = value?.[0];

            return file && file.size <= MAX_FILE_SIZE;
        },
        {
            message: 'File size must not exceed 5 MB',
        }
    )
    .refine(
        (value) => {
            const file = value?.[0];

            return file && ACCEPTED_FILE_TYPES.includes(file.type);
        },
        {
            message: 'Only .pdf, .png, .jpg and .jpeg formats are allowed',
        }
    );

const kycUploadSchema = z.object({
    poiNumber: z
        .string()
        .trim()
        .min(1, 'Proof of Identity number is required')
        .regex(/^\d+$/, 'Proof of Identity number must contain only digits'),

    poaNumber: z
        .string()
        .trim()
        .min(1, 'Proof of Address number is required')
        .regex(/^\d+$/, 'Proof of Address number must contain only digits'),

    poaDocument: fileSchema,

    poiDocument: fileSchema,
});

type KycUploadFormData = z.infer<typeof kycUploadSchema>;

interface KycUploadSidebarComponentProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function KycUploadSidebarComponent({ isOpen, onClose }: KycUploadSidebarComponentProps) {
    const userEmail = sessionStorage.getItem('userEmail');

    const [triggerUploadKycDetails, { isLoading: isSubmitting }] = useUploadKycDetailsMutation();

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<KycUploadFormData>({
        resolver: zodResolver(kycUploadSchema),
        mode: 'onTouched',
        reValidateMode: 'onChange',
    });

    const watchedPoa = watch('poaDocument');
    const watchedPoi = watch('poiDocument');

    const getFileName = (fileInput: FileList | undefined): string | null => {
        if (!fileInput || fileInput.length === 0) {
            return null;
        }

        return fileInput[0]?.name ?? null;
    };

    const poaFileName = getFileName(watchedPoa);
    const poiFileName = getFileName(watchedPoi);

    const handleFormSubmit: SubmitHandler<KycUploadFormData> = async (formData) => {
        if (!userEmail) {
            toast.error('User email is not available. Please re-login and try again.');
            return;
        }

        const poaFile = formData.poaDocument[0];
        const poiFile = formData.poiDocument[0];

        if (!poaFile || !poiFile) {
            return;
        }

        try {
            const result = await triggerUploadKycDetails({
                email: userEmail,
                poi_number: formData.poiNumber,
                poa_number: formData.poaNumber,
                poi_document: poiFile,
                poa_document: poaFile,
            }).unwrap();

            if (result?.status?.toUpperCase() !== 'SUCCESS') {
                toast.error('KYC document upload service is facing an issue. Please try again later.');
                return;
            }

            ShowInConsole('Upload KYC response:', result);

            const normalizedMessage = result?.message?.trim().toLowerCase();
            switch (true) {
                case normalizedMessage?.includes('uploaded successfully but failed to sent user kyc verification mail'):
                    toast.success('User KYC details submitted successfully but failed to send KYC verification mail. Please contact admin.');
                    break;

                case normalizedMessage?.includes("uploaded successfully and kyc verification mail sent to admin"):
                    toast.success('User KYC details submitted successfully and KYC verification mail sent to admin.');
                    break;

                case normalizedMessage?.includes('updated successfully but failed to sent user kyc verification mail'):
                    toast.success('User KYC details updated successfully but failed to send KYC verification mail. Please contact admin.');
                    break;

                case normalizedMessage?.includes("updated successfully and kyc verification mail sent to admin"):
                    toast.success('User KYC details updated successfully and KYC verification mail sent to admin.');
                    break;

                default:
                    toast.success('User KYC details submitted successfully.');
                    break;
            }

            reset();
            onClose();
        } catch (error: any) {
            ShowInConsole('Upload KYC details error:', error);

            const errorMessage = Array.isArray(error?.data?.message)
                ? error.data.message[0]
                : error?.data?.message ||
                error?.message ||
                "Add user kyc details service is facing issue. Please try again later.";

            const normalizedMessage = errorMessage.toLowerCase();

            if (normalizedMessage?.includes("kyc details already exist for this user")) {
                toast.error("KYC details already exist for this user and are not currently eligible for an update.");
                return
            }
            else if (normalizedMessage?.includes("poi number and poa number already exist")) {
                toast.error("POI number and POA number already exist.");
                return
            }
            else if (normalizedMessage?.includes("poi number already exists")) {
                toast.error("POI number already exists.");
                return
            }
            else if (normalizedMessage?.includes("poa number already exists")) {
                toast.error("POA number already exists.");
                return
            }

            toast.error("Add user kyc details service is facing issue. Please try again later.");
        }
    };

    const handleClose = () => {
        if (isSubmitting) {
            return;
        }

        reset();
        onClose();
    };

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

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
                onClick={handleClose}
            />

            {/* Right Drawer */}
            <div className="relative z-10 w-full max-w-md h-full bg-[var(--bg-surface)] border-l border-[var(--line)] shadow-2xl flex flex-col justify-between overflow-y-auto animate-[slideInRight_0.25s_ease-out]">
                <style>{`
                    @keyframes slideInRight {
                        from {
                            transform: translateX(100%);
                        }

                        to {
                            transform: translateX(0);
                        }
                    }
                `}</style>

                {/* Header */}
                <div className="p-6! border-b border-[var(--line)] flex items-center justify-between bg-[var(--bg-subtle)]">
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--ink)] tracking-normal">
                            {KYC_UPLOAD_SIDEBAR_FALLBACK.title}
                        </h3>

                        <p className="text-xs text-[var(--mute)] mt-1!">
                            Upload KYC Documents
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="p-1.5 rounded-lg text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Close sidebar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form
                    id="kycUploadSidebar-form"
                    noValidate
                    onSubmit={handleSubmit(handleFormSubmit)}
                    className="p-6! flex-1 flex flex-col gap-6"
                >
                    <div className="p-3.5! rounded-lg bg-[var(--bg-subtle)] border border-[var(--line)] text-xs text-[var(--ink-soft)] leading-relaxed">
                        {KYC_UPLOAD_SIDEBAR_FALLBACK.description}
                    </div>

                    {/* POI Number */}
                    <CustomInputComponent
                        id="kycUpload-poi-number"
                        label="Proof of Identity Number"
                        placeholder="Enter POI document number"
                        fieldLabelClassname="text-[var(--ink-soft)]"
                        inputClassname="px-4! text-[var(--ink-2)]"
                        type="text"
                        inputMode="numeric"
                        {...register('poiNumber')}
                        error={errors.poiNumber?.message}
                        disabled={isSubmitting}
                    />

                    {/* POA Number */}
                    <CustomInputComponent
                        id="kycUpload-poa-number"
                        label="Proof of Address Number"
                        placeholder="Enter POA document number"
                        fieldLabelClassname="text-[var(--ink-soft)]"
                        inputClassname="px-4! text-[var(--ink-2)]"
                        type="text"
                        inputMode="numeric"
                        {...register('poaNumber')}
                        error={errors.poaNumber?.message}
                        disabled={isSubmitting}
                    />

                    {/* POA Document */}
                    <div className="flex flex-col gap-2">
                        <label
                            htmlFor="kycUpload-poa"
                            className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]"
                        >
                            {KYC_UPLOAD_SIDEBAR_FALLBACK.poaLabel}{' '}
                            <span className="text-[var(--danger)]">*</span>
                        </label>

                        <div className="relative border-2 border-dashed border-[var(--line-strong)] hover:border-[var(--gold)] rounded-xl p-4! bg-[var(--bg-subtle)] transition-colors text-center cursor-pointer flex flex-col items-center justify-center gap-2">
                            <input
                                id="kycUpload-poa"
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg"
                                disabled={isSubmitting}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                onChange={(event) => {
                                    if (event.target.files) {
                                        setValue(
                                            'poaDocument',
                                            event.target.files,
                                            {
                                                shouldValidate: true,
                                                shouldTouch: true,
                                            }
                                        );
                                    }
                                }}
                            />

                            {poaFileName ? (
                                <div className="flex items-center gap-2 text-xs font-medium text-[var(--ok)]">
                                    <CheckCircle className="w-4 h-4 shrink-0" />

                                    <span className="truncate max-w-[240px]">
                                        {poaFileName}
                                    </span>
                                </div>
                            ) : (
                                <>
                                    <Upload className="w-6 h-6 text-[var(--mute)]" />

                                    <span className="text-xs text-[var(--ink-soft)] font-medium">
                                        Click or drag POA file here
                                    </span>

                                    <span className="text-[10px] text-[var(--mute)]">
                                        PDF, PNG, JPG, JPEG up to 5MB
                                    </span>
                                </>
                            )}
                        </div>

                        {errors.poaDocument && (
                            <p className="text-xs text-[var(--danger)] mt-0.5!">
                                {errors.poaDocument.message}
                            </p>
                        )}
                    </div>

                    {/* POI Document */}
                    <div className="flex flex-col gap-2">
                        <label
                            htmlFor="kycUpload-poi"
                            className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]"
                        >
                            {KYC_UPLOAD_SIDEBAR_FALLBACK.poiLabel}{' '}
                            <span className="text-[var(--danger)]">*</span>
                        </label>

                        <div className="relative border-2 border-dashed border-[var(--line-strong)] hover:border-[var(--gold)] rounded-xl p-4! bg-[var(--bg-subtle)] transition-colors text-center cursor-pointer flex flex-col items-center justify-center gap-2">
                            <input
                                id="kycUpload-poi"
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg"
                                disabled={isSubmitting}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                onChange={(event) => {
                                    if (event.target.files) {
                                        setValue(
                                            'poiDocument',
                                            event.target.files,
                                            {
                                                shouldValidate: true,
                                                shouldTouch: true,
                                            }
                                        );
                                    }
                                }}
                            />

                            {poiFileName ? (
                                <div className="flex items-center gap-2 text-xs font-medium text-[var(--ok)]">
                                    <CheckCircle className="w-4 h-4 shrink-0" />

                                    <span className="truncate max-w-[240px]">
                                        {poiFileName}
                                    </span>
                                </div>
                            ) : (
                                <>
                                    <FileText className="w-6 h-6 text-[var(--mute)]" />

                                    <span className="text-xs text-[var(--ink-soft)] font-medium">
                                        Click or drag POI file here
                                    </span>

                                    <span className="text-[10px] text-[var(--mute)]">
                                        PDF, PNG, JPG, JPEG up to 5MB
                                    </span>
                                </>
                            )}
                        </div>

                        {errors.poiDocument && (
                            <p className="text-xs text-[var(--danger)] mt-0.5!">
                                {errors.poiDocument.message}
                            </p>
                        )}
                    </div>
                </form>

                {/* Footer */}
                <div className="p-6! border-t border-[var(--line)] bg-[var(--bg-subtle)] flex items-center justify-end gap-3">
                    <div className="w-fit h-fit">
                        <CustomButtonComponent
                            id="kycUploadSidebar-cancel-btn"
                            label="Cancel"
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="w-fit h-fit">
                        <CustomButtonComponent
                            id="kycUploadSidebar-submit-btn"
                            label="Submit KYC"
                            type="submit"
                            form="kycUploadSidebar-form"
                            variant="navy"
                            showButtonLoader={isSubmitting}
                            disabled={isSubmitting}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}