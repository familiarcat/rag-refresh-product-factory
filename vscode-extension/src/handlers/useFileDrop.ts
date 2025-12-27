import { useCallback, useState, DragEvent, ClipboardEvent } from 'react';

export interface FileAttachment {
    name: string;
    type: string;
    content: string; // Base64
}

/**
 * Hook to handle Drag & Drop and Paste events for images/files in the Chat Webview.
 */
export const useFileDrop = (onFilesDetected: (files: FileAttachment[]) => void) => {
    const [isDragging, setIsDragging] = useState(false);

    const readFileAsBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const processFiles = useCallback(async (fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return;

        const processedFiles: FileAttachment[] = [];

        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            
            // Filter for images, PDFs, or text files
            if (file.type.startsWith('image/') || file.type === 'application/pdf' || file.type.startsWith('text/')) {
                try {
                    const content = await readFileAsBase64(file);
                    processedFiles.push({
                        name: file.name,
                        type: file.type,
                        content: content
                    });
                } catch (err) {
                    console.error('Error reading file:', err);
                }
            }
        }

        if (processedFiles.length > 0) {
            onFilesDetected(processedFiles);
        }
    }, [onFilesDetected]);

    const onDrop = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        processFiles(e.dataTransfer.files);
    }, [processFiles]);

    const onDragOver = useCallback((e: DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback((e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const onPaste = useCallback((e: ClipboardEvent) => {
        // Handle paste events (e.g. screenshots from clipboard)
        if (e.clipboardData.files.length > 0) {
            e.preventDefault();
            processFiles(e.clipboardData.files);
        }
    }, [processFiles]);

    return {
        isDragging,
        dragHandlers: {
            onDrop,
            onDragOver,
            onDragLeave,
            onPaste
        }
    };
};
