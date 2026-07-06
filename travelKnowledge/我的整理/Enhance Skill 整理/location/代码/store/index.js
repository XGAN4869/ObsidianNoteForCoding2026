import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
    state: () => {
        return {
            // TODO
        }
    },
    actions: {
        loadData() {
            // TODO
        }
    }

})

export * from './modules/account';
export * from './modules/permission';
