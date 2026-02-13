import { reactive, computed } from 'vue';

export interface CSVFile {
    id: string;
    name: string;
    data: any[];
    arrayData?: any[][];
    width: number;
    height: number;
}

export const csvStore = reactive({
    files: [] as CSVFile[],
    activeFileId: null as string | null, // For Data Viewer / Code App

    addFile(file: Omit<CSVFile, 'id'>) {
        // Check if file with same name exists? 
        // Maybe we just append _1, etc. or just allow dupes with different IDs.
        const id = Math.random().toString(36).substr(2, 9);
        const newFile = { ...file, id };
        this.files.push(newFile);
        return id;
    },

    removeFile(id: string) {
        const index = this.files.findIndex(f => f.id === id);
        if (index !== -1) {
            this.files.splice(index, 1);
            if (this.activeFileId === id) {
                this.activeFileId = this.files[0]?.id || null;
            }
        }
    },

    getFile(id: string) {
        return this.files.find(f => f.id === id);
    },

    setActiveFile(id: string) {
        this.activeFileId = id;
    },

    updateFileContent(id: string, data: any[]) {
        const file = this.files.find(f => f.id === id);
        if (!file) return;

        file.data = data;
        if (data.length > 0) {
            const headers = Object.keys(data[0]);
            const arrayData = [headers];
            data.forEach(row => {
                arrayData.push(headers.map(h => row[h]));
            });
            file.arrayData = arrayData;
            file.width = headers.length;
            file.height = data.length;
        } else {
            file.arrayData = [];
            file.width = 0;
            file.height = 0;
        }
    }
});

export const activeCSVData = computed(() => {
    if (!csvStore.activeFileId) return [];
    const file = csvStore.files.find(f => f.id === csvStore.activeFileId);
    return file ? file.data : [];
});
