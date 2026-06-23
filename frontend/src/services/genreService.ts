import axios from 'axios'

export interface Genre {
    _id:         string
    name:        string
    color?:      string
    description?: string
    trackCount?: number
}

export const genreService = {
    getAll: async (): Promise<Genre[]> => {
        const res = await axios.get('/api/genres')
        return res.data?.data ?? []
    },
}
