import { get, post } from './api';

export interface ContentData {
    slug: string;
    title: string;
    content: string;
    updatedAt?: string;
}

export interface ContentResponse {
    success: boolean;
    data: ContentData;
    message?: string;
}

export async function getContent(slug: string) {
    return get<ContentResponse>(`/content/${slug}`);
}

export async function updateContent(slug: string, data: { title: string; content: string }) {
    return post<ContentResponse>(`/content/${slug}`, data);
}
