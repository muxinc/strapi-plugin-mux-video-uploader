import type Mux from '@mux/mux-node';
import { z } from 'zod';
export declare const SUPPORTED_MUX_LANGUAGES: readonly [{
    readonly label: "English";
    readonly code: "en";
    readonly state: "Stable";
}, {
    readonly label: "Spanish";
    readonly code: "es";
    readonly state: "Stable";
}, {
    readonly label: "Italian";
    readonly code: "it";
    readonly state: "Stable";
}, {
    readonly label: "Portuguese";
    readonly code: "pt";
    readonly state: "Stable";
}, {
    readonly label: "German";
    readonly code: "de";
    readonly state: "Stable";
}, {
    readonly label: "French";
    readonly code: "fr";
    readonly state: "Stable";
}, {
    readonly label: "Polish";
    readonly code: "pl";
    readonly state: "Beta";
}, {
    readonly label: "Russian";
    readonly code: "ru";
    readonly state: "Beta";
}, {
    readonly label: "Dutch";
    readonly code: "nl";
    readonly state: "Beta";
}, {
    readonly label: "Catalan";
    readonly code: "ca";
    readonly state: "Beta";
}, {
    readonly label: "Turkish";
    readonly code: "tr";
    readonly state: "Beta";
}, {
    readonly label: "Swedish";
    readonly code: "sv";
    readonly state: "Beta";
}, {
    readonly label: "Ukrainian";
    readonly code: "uk";
    readonly state: "Beta";
}, {
    readonly label: "Norwegian";
    readonly code: "no";
    readonly state: "Beta";
}, {
    readonly label: "Finnish";
    readonly code: "fi";
    readonly state: "Beta";
}, {
    readonly label: "Slovak";
    readonly code: "sk";
    readonly state: "Beta";
}, {
    readonly label: "Greek";
    readonly code: "el";
    readonly state: "Beta";
}, {
    readonly label: "Czech";
    readonly code: "cs";
    readonly state: "Beta";
}, {
    readonly label: "Croatian";
    readonly code: "hr";
    readonly state: "Beta";
}, {
    readonly label: "Danish";
    readonly code: "da";
    readonly state: "Beta";
}, {
    readonly label: "Romanian";
    readonly code: "ro";
    readonly state: "Beta";
}, {
    readonly label: "Bulgarian";
    readonly code: "bg";
    readonly state: "Beta";
}];
declare const SUPPORTED_MUX_LANGUAGES_VALUES: ("en" | "es" | "it" | "pt" | "de" | "fr" | "pl" | "ru" | "nl" | "ca" | "tr" | "sv" | "uk" | "no" | "fi" | "sk" | "el" | "cs" | "hr" | "da" | "ro" | "bg")[];
export type SupportedMuxLanguage = (typeof SUPPORTED_MUX_LANGUAGES_VALUES)[number];
/** .srt or .vtt file uploaded as subtitle/caption for a video */
export declare const TextTrackFile: z.ZodObject<{
    contents: z.ZodString;
    type: z.ZodString;
    name: z.ZodString;
    size: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type?: string;
    contents?: string;
    name?: string;
    size?: number;
}, {
    type?: string;
    contents?: string;
    name?: string;
    size?: number;
}>;
/** Subtitles and captions uploaded by the user */
export declare const CustomTextTrack: z.ZodObject<{
    file: z.ZodObject<{
        contents: z.ZodString;
        type: z.ZodString;
        name: z.ZodString;
        size: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type?: string;
        contents?: string;
        name?: string;
        size?: number;
    }, {
        type?: string;
        contents?: string;
        name?: string;
        size?: number;
    }>;
    name: z.ZodString;
    language_code: z.ZodString;
    closed_captions: z.ZodDefault<z.ZodBoolean>;
    stored_track: z.ZodOptional<z.ZodType<Mux.Video.Assets.Track, z.ZodTypeDef, Mux.Video.Assets.Track>>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    file?: {
        type?: string;
        contents?: string;
        name?: string;
        size?: number;
    };
    language_code?: string;
    closed_captions?: boolean;
    stored_track?: Mux.Video.Assets.Track;
}, {
    name?: string;
    file?: {
        type?: string;
        contents?: string;
        name?: string;
        size?: number;
    };
    language_code?: string;
    closed_captions?: boolean;
    stored_track?: Mux.Video.Assets.Track;
}>;
export type ParsedCustomTextTrack = z.infer<typeof CustomTextTrack>;
export type StoredTextTrack = ParsedCustomTextTrack & {
    id: string;
};
export declare const UploadConfig: z.ZodEffects<z.ZodObject<{
    /**
     * Enable static renditions by setting this to 'standard'. Can be overwritten on a per-asset basis.
     * @see {@link https://docs.mux.com/guides/video/enable-static-mp4-renditions#why-enable-mp4-support}
     * @defaultValue 'none'
     */
    mp4_support: z.ZodDefault<z.ZodEnum<["none", "standard"]>>;
    /**
     * Max resolution tier can be used to control the maximum resolution_tier your asset is encoded, stored, and streamed at.
     * @see {@link https://docs.mux.com/guides/stream-videos-in-4k}
     * @defaultValue '1080p'
     */
    max_resolution_tier: z.ZodDefault<z.ZodEnum<["2160p", "1440p", "1080p"]>>;
    /**
     * The video quality informs the cost, quality, and available platform features for the asset.
     * @see {@link https://docs.mux.com/guides/use-video-quality-levels}
     * @defaultValue 'plus'
     */
    video_quality: z.ZodDefault<z.ZodEnum<["basic", "plus"]>>;
    /**
     * Whether or not to use signed URLs, making the asset private
     * @see {@link https://docs.mux.com/guides/use-encoding-tiers}
     * @defaultValue 'false'
     */
    signed: z.ZodDefault<z.ZodBoolean>;
    autogenerated_captions_languages: z.ZodOptional<z.ZodArray<z.ZodObject<{
        code: z.ZodEnum<["en" | "es" | "it" | "pt" | "de" | "fr" | "pl" | "ru" | "nl" | "ca" | "tr" | "sv" | "uk" | "no" | "fi" | "sk" | "el" | "cs" | "hr" | "da" | "ro" | "bg", ...("en" | "es" | "it" | "pt" | "de" | "fr" | "pl" | "ru" | "nl" | "ca" | "tr" | "sv" | "uk" | "no" | "fi" | "sk" | "el" | "cs" | "hr" | "da" | "ro" | "bg")[]]>;
        isSourceLanguage: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        code?: "en" | "es" | "it" | "pt" | "de" | "fr" | "pl" | "ru" | "nl" | "ca" | "tr" | "sv" | "uk" | "no" | "fi" | "sk" | "el" | "cs" | "hr" | "da" | "ro" | "bg";
        isSourceLanguage?: boolean;
    }, {
        code?: "en" | "es" | "it" | "pt" | "de" | "fr" | "pl" | "ru" | "nl" | "ca" | "tr" | "sv" | "uk" | "no" | "fi" | "sk" | "el" | "cs" | "hr" | "da" | "ro" | "bg";
        isSourceLanguage?: boolean;
    }>, "many">>;
    custom_text_tracks: z.ZodOptional<z.ZodArray<z.ZodObject<{
        file: z.ZodObject<{
            contents: z.ZodString;
            type: z.ZodString;
            name: z.ZodString;
            size: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            type?: string;
            contents?: string;
            name?: string;
            size?: number;
        }, {
            type?: string;
            contents?: string;
            name?: string;
            size?: number;
        }>;
        name: z.ZodString;
        language_code: z.ZodString;
        closed_captions: z.ZodDefault<z.ZodBoolean>;
        stored_track: z.ZodOptional<z.ZodType<Mux.Video.Assets.Track, z.ZodTypeDef, Mux.Video.Assets.Track>>;
    }, "strip", z.ZodTypeAny, {
        name?: string;
        file?: {
            type?: string;
            contents?: string;
            name?: string;
            size?: number;
        };
        language_code?: string;
        closed_captions?: boolean;
        stored_track?: Mux.Video.Assets.Track;
    }, {
        name?: string;
        file?: {
            type?: string;
            contents?: string;
            name?: string;
            size?: number;
        };
        language_code?: string;
        closed_captions?: boolean;
        stored_track?: Mux.Video.Assets.Track;
    }>, "many">>;
    upload_type: z.ZodDefault<z.ZodEnum<["file", "url"]>>;
}, "strip", z.ZodTypeAny, {
    mp4_support?: "none" | "standard";
    max_resolution_tier?: "2160p" | "1440p" | "1080p";
    video_quality?: "basic" | "plus";
    signed?: boolean;
    autogenerated_captions_languages?: {
        code?: "en" | "es" | "it" | "pt" | "de" | "fr" | "pl" | "ru" | "nl" | "ca" | "tr" | "sv" | "uk" | "no" | "fi" | "sk" | "el" | "cs" | "hr" | "da" | "ro" | "bg";
        isSourceLanguage?: boolean;
    }[];
    custom_text_tracks?: {
        name?: string;
        file?: {
            type?: string;
            contents?: string;
            name?: string;
            size?: number;
        };
        language_code?: string;
        closed_captions?: boolean;
        stored_track?: Mux.Video.Assets.Track;
    }[];
    upload_type?: "file" | "url";
}, {
    mp4_support?: "none" | "standard";
    max_resolution_tier?: "2160p" | "1440p" | "1080p";
    video_quality?: "basic" | "plus";
    signed?: boolean;
    autogenerated_captions_languages?: {
        code?: "en" | "es" | "it" | "pt" | "de" | "fr" | "pl" | "ru" | "nl" | "ca" | "tr" | "sv" | "uk" | "no" | "fi" | "sk" | "el" | "cs" | "hr" | "da" | "ro" | "bg";
        isSourceLanguage?: boolean;
    }[];
    custom_text_tracks?: {
        name?: string;
        file?: {
            type?: string;
            contents?: string;
            name?: string;
            size?: number;
        };
        language_code?: string;
        closed_captions?: boolean;
        stored_track?: Mux.Video.Assets.Track;
    }[];
    upload_type?: "file" | "url";
}>, {
    mp4_support?: "none" | "standard";
    max_resolution_tier?: "2160p" | "1440p" | "1080p";
    video_quality?: "basic" | "plus";
    signed?: boolean;
    autogenerated_captions_languages?: {
        code?: "en" | "es" | "it" | "pt" | "de" | "fr" | "pl" | "ru" | "nl" | "ca" | "tr" | "sv" | "uk" | "no" | "fi" | "sk" | "el" | "cs" | "hr" | "da" | "ro" | "bg";
        isSourceLanguage?: boolean;
    }[];
    custom_text_tracks?: {
        name?: string;
        file?: {
            type?: string;
            contents?: string;
            name?: string;
            size?: number;
        };
        language_code?: string;
        closed_captions?: boolean;
        stored_track?: Mux.Video.Assets.Track;
    }[];
    upload_type?: "file" | "url";
}, {
    mp4_support?: "none" | "standard";
    max_resolution_tier?: "2160p" | "1440p" | "1080p";
    video_quality?: "basic" | "plus";
    signed?: boolean;
    autogenerated_captions_languages?: {
        code?: "en" | "es" | "it" | "pt" | "de" | "fr" | "pl" | "ru" | "nl" | "ca" | "tr" | "sv" | "uk" | "no" | "fi" | "sk" | "el" | "cs" | "hr" | "da" | "ro" | "bg";
        isSourceLanguage?: boolean;
    }[];
    custom_text_tracks?: {
        name?: string;
        file?: {
            type?: string;
            contents?: string;
            name?: string;
            size?: number;
        };
        language_code?: string;
        closed_captions?: boolean;
        stored_track?: Mux.Video.Assets.Track;
    }[];
    upload_type?: "file" | "url";
}>;
export type RequestedUploadConfig = z.input<typeof UploadConfig>;
export type ParsedUploadConfig = z.infer<typeof UploadConfig>;
export declare const UploadData: z.ZodIntersection<z.ZodIntersection<z.ZodObject<{
    title: z.ZodString;
}, "strip", z.ZodTypeAny, {
    title?: string;
}, {
    title?: string;
}>, z.ZodDiscriminatedUnion<"upload_type", [z.ZodObject<{
    upload_type: z.ZodLiteral<"file">;
    file: z.ZodType<File, z.ZodTypeDef, File>;
}, "strip", z.ZodTypeAny, {
    file?: File;
    upload_type?: "file";
}, {
    file?: File;
    upload_type?: "file";
}>, z.ZodObject<{
    upload_type: z.ZodLiteral<"url">;
    url: z.ZodString;
}, "strip", z.ZodTypeAny, {
    url?: string;
    upload_type?: "url";
}, {
    url?: string;
    upload_type?: "url";
}>]>>, z.ZodEffects<z.ZodObject<{
    /**
     * Enable static renditions by setting this to 'standard'. Can be overwritten on a per-asset basis.
     * @see {@link https://docs.mux.com/guides/video/enable-static-mp4-renditions#why-enable-mp4-support}
     * @defaultValue 'none'
     */
    mp4_support: z.ZodDefault<z.ZodEnum<["none", "standard"]>>;
    /**
     * Max resolution tier can be used to control the maximum resolution_tier your asset is encoded, stored, and streamed at.
     * @see {@link https://docs.mux.com/guides/stream-videos-in-4k}
     * @defaultValue '1080p'
     */
    max_resolution_tier: z.ZodDefault<z.ZodEnum<["2160p", "1440p", "1080p"]>>;
    /**
     * The video quality informs the cost, quality, and available platform features for the asset.
     * @see {@link https://docs.mux.com/guides/use-video-quality-levels}
     * @defaultValue 'plus'
     */
    video_quality: z.ZodDefault<z.ZodEnum<["basic", "plus"]>>;
    /**
     * Whether or not to use signed URLs, making the asset private
     * @see {@link https://docs.mux.com/guides/use-encoding-tiers}
     * @defaultValue 'false'
     */
    signed: z.ZodDefault<z.ZodBoolean>;
    autogenerated_captions_languages: z.ZodOptional<z.ZodArray<z.ZodObject<{
        code: z.ZodEnum<["en" | "es" | "it" | "pt" | "de" | "fr" | "pl" | "ru" | "nl" | "ca" | "tr" | "sv" | "uk" | "no" | "fi" | "sk" | "el" | "cs" | "hr" | "da" | "ro" | "bg", ...("en" | "es" | "it" | "pt" | "de" | "fr" | "pl" | "ru" | "nl" | "ca" | "tr" | "sv" | "uk" | "no" | "fi" | "sk" | "el" | "cs" | "hr" | "da" | "ro" | "bg")[]]>;
        isSourceLanguage: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        code?: "en" | "es" | "it" | "pt" | "de" | "fr" | "pl" | "ru" | "nl" | "ca" | "tr" | "sv" | "uk" | "no" | "fi" | "sk" | "el" | "cs" | "hr" | "da" | "ro" | "bg";
        isSourceLanguage?: boolean;
    }, {
        code?: "en" | "es" | "it" | "pt" | "de" | "fr" | "pl" | "ru" | "nl" | "ca" | "tr" | "sv" | "uk" | "no" | "fi" | "sk" | "el" | "cs" | "hr" | "da" | "ro" | "bg";
        isSourceLanguage?: boolean;
    }>, "many">>;
    custom_text_tracks: z.ZodOptional<z.ZodArray<z.ZodObject<{
        file: z.ZodObject<{
            contents: z.ZodString;
            type: z.ZodString;
            name: z.ZodString;
            size: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            type?: string;
            contents?: string;
            name?: string;
            size?: number;
        }, {
            type?: string;
            contents?: string;
            name?: string;
            size?: number;
        }>;
        name: z.ZodString;
        language_code: z.ZodString;
        closed_captions: z.ZodDefault<z.ZodBoolean>;
        stored_track: z.ZodOptional<z.ZodType<Mux.Video.Assets.Track, z.ZodTypeDef, Mux.Video.Assets.Track>>;
    }, "strip", z.ZodTypeAny, {
        name?: string;
        file?: {
            type?: string;
            contents?: string;
            name?: string;
            size?: number;
        };
        language_code?: string;
        closed_captions?: boolean;
        stored_track?: Mux.Video.Assets.Track;
    }, {
        name?: string;
        file?: {
            type?: string;
            contents?: string;
            name?: string;
            size?: number;
        };
        language_code?: string;
        closed_captions?: boolean;
        stored_track?: Mux.Video.Assets.Track;
    }>, "many">>;
    upload_type: z.ZodDefault<z.ZodEnum<["file", "url"]>>;
}, "strip", z.ZodTypeAny, {
    mp4_support?: "none" | "standard";
    max_resolution_tier?: "2160p" | "1440p" | "1080p";
    video_quality?: "basic" | "plus";
    signed?: boolean;
    autogenerated_captions_languages?: {
        code?: "en" | "es" | "it" | "pt" | "de" | "fr" | "pl" | "ru" | "nl" | "ca" | "tr" | "sv" | "uk" | "no" | "fi" | "sk" | "el" | "cs" | "hr" | "da" | "ro" | "bg";
        isSourceLanguage?: boolean;
    }[];
    custom_text_tracks?: {
        name?: string;
        file?: {
            type?: string;
            contents?: string;
            name?: string;
            size?: number;
        };
        language_code?: string;
        closed_captions?: boolean;
        stored_track?: Mux.Video.Assets.Track;
    }[];
    upload_type?: "file" | "url";
}, {
    mp4_support?: "none" | "standard";
    max_resolution_tier?: "2160p" | "1440p" | "1080p";
    video_quality?: "basic" | "plus";
    signed?: boolean;
    autogenerated_captions_languages?: {
        code?: "en" | "es" | "it" | "pt" | "de" | "fr" | "pl" | "ru" | "nl" | "ca" | "tr" | "sv" | "uk" | "no" | "fi" | "sk" | "el" | "cs" | "hr" | "da" | "ro" | "bg";
        isSourceLanguage?: boolean;
    }[];
    custom_text_tracks?: {
        name?: string;
        file?: {
            type?: string;
            contents?: string;
            name?: string;
            size?: number;
        };
        language_code?: string;
        closed_captions?: boolean;
        stored_track?: Mux.Video.Assets.Track;
    }[];
    upload_type?: "file" | "url";
}>, {
    mp4_support?: "none" | "standard";
    max_resolution_tier?: "2160p" | "1440p" | "1080p";
    video_quality?: "basic" | "plus";
    signed?: boolean;
    autogenerated_captions_languages?: {
        code?: "en" | "es" | "it" | "pt" | "de" | "fr" | "pl" | "ru" | "nl" | "ca" | "tr" | "sv" | "uk" | "no" | "fi" | "sk" | "el" | "cs" | "hr" | "da" | "ro" | "bg";
        isSourceLanguage?: boolean;
    }[];
    custom_text_tracks?: {
        name?: string;
        file?: {
            type?: string;
            contents?: string;
            name?: string;
            size?: number;
        };
        language_code?: string;
        closed_captions?: boolean;
        stored_track?: Mux.Video.Assets.Track;
    }[];
    upload_type?: "file" | "url";
}, {
    mp4_support?: "none" | "standard";
    max_resolution_tier?: "2160p" | "1440p" | "1080p";
    video_quality?: "basic" | "plus";
    signed?: boolean;
    autogenerated_captions_languages?: {
        code?: "en" | "es" | "it" | "pt" | "de" | "fr" | "pl" | "ru" | "nl" | "ca" | "tr" | "sv" | "uk" | "no" | "fi" | "sk" | "el" | "cs" | "hr" | "da" | "ro" | "bg";
        isSourceLanguage?: boolean;
    }[];
    custom_text_tracks?: {
        name?: string;
        file?: {
            type?: string;
            contents?: string;
            name?: string;
            size?: number;
        };
        language_code?: string;
        closed_captions?: boolean;
        stored_track?: Mux.Video.Assets.Track;
    }[];
    upload_type?: "file" | "url";
}>>;
export type RequestedUploadData = z.input<typeof UploadData>;
/**
 * Used by `server/controllers/mux.ts` as that doesn't receive the file from the front-end.
 * Users upload the file directly from the browser via the presigned URL generated in `parseUploadRequest`.
 */
export declare const UploadDataWithoutFile: z.ZodIntersection<z.ZodIntersection<z.ZodObject<{
    title: z.ZodString;
}, "strip", z.ZodTypeAny, {
    title?: string;
}, {
    title?: string;
}>, z.ZodDiscriminatedUnion<"upload_type", [z.ZodObject<{
    upload_type: z.ZodLiteral<"file">;
}, "strip", z.ZodTypeAny, {
    upload_type?: "file";
}, {
    upload_type?: "file";
}>, z.ZodObject<{
    upload_type: z.ZodLiteral<"url">;
    url: z.ZodString;
}, "strip", z.ZodTypeAny, {
    url?: string;
    upload_type?: "url";
}, {
    url?: string;
    upload_type?: "url";
}>]>>, z.ZodEffects<z.ZodObject<{
    /**
     * Enable static renditions by setting this to 'standard'. Can be overwritten on a per-asset basis.
     * @see {@link https://docs.mux.com/guides/video/enable-static-mp4-renditions#why-enable-mp4-support}
     * @defaultValue 'none'
     */
    mp4_support: z.ZodDefault<z.ZodEnum<["none", "standard"]>>;
    /**
     * Max resolution tier can be used to control the maximum resolution_tier your asset is encoded, stored, and streamed at.
     * @see {@link https://docs.mux.com/guides/stream-videos-in-4k}
     * @defaultValue '1080p'
     */
    max_resolution_tier: z.ZodDefault<z.ZodEnum<["2160p", "1440p", "1080p"]>>;
    /**
     * The video quality informs the cost, quality, and available platform features for the asset.
     * @see {@link https://docs.mux.com/guides/use-video-quality-levels}
     * @defaultValue 'plus'
     */
    video_quality: z.ZodDefault<z.ZodEnum<["basic", "plus"]>>;
    /**
     * Whether or not to use signed URLs, making the asset private
     * @see {@link https://docs.mux.com/guides/use-encoding-tiers}
     * @defaultValue 'false'
     */
    signed: z.ZodDefault<z.ZodBoolean>;
    autogenerated_captions_languages: z.ZodOptional<z.ZodArray<z.ZodObject<{
        code: z.ZodEnum<["en" | "es" | "it" | "pt" | "de" | "fr" | "pl" | "ru" | "nl" | "ca" | "tr" | "sv" | "uk" | "no" | "fi" | "sk" | "el" | "cs" | "hr" | "da" | "ro" | "bg", ...("en" | "es" | "it" | "pt" | "de" | "fr" | "pl" | "ru" | "nl" | "ca" | "tr" | "sv" | "uk" | "no" | "fi" | "sk" | "el" | "cs" | "hr" | "da" | "ro" | "bg")[]]>;
        isSourceLanguage: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        code?: "en" | "es" | "it" | "pt" | "de" | "fr" | "pl" | "ru" | "nl" | "ca" | "tr" | "sv" | "uk" | "no" | "fi" | "sk" | "el" | "cs" | "hr" | "da" | "ro" | "bg";
        isSourceLanguage?: boolean;
    }, {
        code?: "en" | "es" | "it" | "pt" | "de" | "fr" | "pl" | "ru" | "nl" | "ca" | "tr" | "sv" | "uk" | "no" | "fi" | "sk" | "el" | "cs" | "hr" | "da" | "ro" | "bg";
        isSourceLanguage?: boolean;
    }>, "many">>;
    custom_text_tracks: z.ZodOptional<z.ZodArray<z.ZodObject<{
        file: z.ZodObject<{
            contents: z.ZodString;
            type: z.ZodString;
            name: z.ZodString;
            size: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            type?: string;
            contents?: string;
            name?: string;
            size?: number;
        }, {
            type?: string;
            contents?: string;
            name?: string;
            size?: number;
        }>;
        name: z.ZodString;
        language_code: z.ZodString;
        closed_captions: z.ZodDefault<z.ZodBoolean>;
        stored_track: z.ZodOptional<z.ZodType<Mux.Video.Assets.Track, z.ZodTypeDef, Mux.Video.Assets.Track>>;
    }, "strip", z.ZodTypeAny, {
        name?: string;
        file?: {
            type?: string;
            contents?: string;
            name?: string;
            size?: number;
        };
        language_code?: string;
        closed_captions?: boolean;
        stored_track?: Mux.Video.Assets.Track;
    }, {
        name?: string;
        file?: {
            type?: string;
            contents?: string;
            name?: string;
            size?: number;
        };
        language_code?: string;
        closed_captions?: boolean;
        stored_track?: Mux.Video.Assets.Track;
    }>, "many">>;
    upload_type: z.ZodDefault<z.ZodEnum<["file", "url"]>>;
}, "strip", z.ZodTypeAny, {
    mp4_support?: "none" | "standard";
    max_resolution_tier?: "2160p" | "1440p" | "1080p";
    video_quality?: "basic" | "plus";
    signed?: boolean;
    autogenerated_captions_languages?: {
        code?: "en" | "es" | "it" | "pt" | "de" | "fr" | "pl" | "ru" | "nl" | "ca" | "tr" | "sv" | "uk" | "no" | "fi" | "sk" | "el" | "cs" | "hr" | "da" | "ro" | "bg";
        isSourceLanguage?: boolean;
    }[];
    custom_text_tracks?: {
        name?: string;
        file?: {
            type?: string;
            contents?: string;
            name?: string;
            size?: number;
        };
        language_code?: string;
        closed_captions?: boolean;
        stored_track?: Mux.Video.Assets.Track;
    }[];
    upload_type?: "file" | "url";
}, {
    mp4_support?: "none" | "standard";
    max_resolution_tier?: "2160p" | "1440p" | "1080p";
    video_quality?: "basic" | "plus";
    signed?: boolean;
    autogenerated_captions_languages?: {
        code?: "en" | "es" | "it" | "pt" | "de" | "fr" | "pl" | "ru" | "nl" | "ca" | "tr" | "sv" | "uk" | "no" | "fi" | "sk" | "el" | "cs" | "hr" | "da" | "ro" | "bg";
        isSourceLanguage?: boolean;
    }[];
    custom_text_tracks?: {
        name?: string;
        file?: {
            type?: string;
            contents?: string;
            name?: string;
            size?: number;
        };
        language_code?: string;
        closed_captions?: boolean;
        stored_track?: Mux.Video.Assets.Track;
    }[];
    upload_type?: "file" | "url";
}>, {
    mp4_support?: "none" | "standard";
    max_resolution_tier?: "2160p" | "1440p" | "1080p";
    video_quality?: "basic" | "plus";
    signed?: boolean;
    autogenerated_captions_languages?: {
        code?: "en" | "es" | "it" | "pt" | "de" | "fr" | "pl" | "ru" | "nl" | "ca" | "tr" | "sv" | "uk" | "no" | "fi" | "sk" | "el" | "cs" | "hr" | "da" | "ro" | "bg";
        isSourceLanguage?: boolean;
    }[];
    custom_text_tracks?: {
        name?: string;
        file?: {
            type?: string;
            contents?: string;
            name?: string;
            size?: number;
        };
        language_code?: string;
        closed_captions?: boolean;
        stored_track?: Mux.Video.Assets.Track;
    }[];
    upload_type?: "file" | "url";
}, {
    mp4_support?: "none" | "standard";
    max_resolution_tier?: "2160p" | "1440p" | "1080p";
    video_quality?: "basic" | "plus";
    signed?: boolean;
    autogenerated_captions_languages?: {
        code?: "en" | "es" | "it" | "pt" | "de" | "fr" | "pl" | "ru" | "nl" | "ca" | "tr" | "sv" | "uk" | "no" | "fi" | "sk" | "el" | "cs" | "hr" | "da" | "ro" | "bg";
        isSourceLanguage?: boolean;
    }[];
    custom_text_tracks?: {
        name?: string;
        file?: {
            type?: string;
            contents?: string;
            name?: string;
            size?: number;
        };
        language_code?: string;
        closed_captions?: boolean;
        stored_track?: Mux.Video.Assets.Track;
    }[];
    upload_type?: "file" | "url";
}>>;
export declare function uploadConfigToNewAssetInput(config: ParsedUploadConfig, storedTextTracks?: StoredTextTrack[], url?: string): Mux.Video.Assets.AssetCreateParams.Input[] | undefined;
export {};
