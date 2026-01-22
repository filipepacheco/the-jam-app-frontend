import type {JamResponseDto} from "../../types/api.types.ts";
import {useTranslation} from "react-i18next";
import {useNavigate} from "react-router-dom";

/**
 * Dashboard Tab Component
 */
export function DashboardTab({jam}: { jam: JamResponseDto }) {
    const {t} = useTranslation()
    const navigate = useNavigate()

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">📺 {t('jam_management.dashboard.title')}</h2>
            <div className="alert alert-info">
                <p>{t('jam_management.dashboard.description')}</p>
            </div>
            <button
                onClick={() => navigate(`/jams/${jam.id}`)}
                className="btn btn-primary"
            >
                {t('jam_management.dashboard.open_btn')}
            </button>
        </div>
    )
}