import type {JamResponseDto} from "../../types/api.types.ts";
import {useTranslation} from "react-i18next";
import {useNavigate} from "react-router-dom";
import {Alert} from "../../components";
import {getJamPath} from "../../utils/jamUrl";

/**
 * Dashboard Tab Component
 */
export function DashboardTab({jam}: { jam: JamResponseDto }) {
    const {t} = useTranslation()
    const navigate = useNavigate()

    return (
        <div className="space-y-4">
            <Alert type="info" message={t('jam_management.dashboard.description')} />
            <button
                onClick={() => navigate(getJamPath(jam))}
                className="btn btn-primary"
            >
                {t('jam_management.dashboard.open_btn')}
            </button>
        </div>
    )
}