import {EtaHarvesting} from "./EtaHarvesting";
import {TargetsWithMastery} from "./TargetsWithMastery";

export class TargetsWithIntensity extends TargetsWithMastery {
    public intensityMilestone: number;
    public intensity: number;
    protected readonly current!: EtaHarvesting;

    constructor(current: EtaHarvesting, settings: any) {
        super(current, settings);
        if (current.action === undefined) {
            this.intensityMilestone = 0;
            this.intensity = 0;
            return this;
        }
        // target mastery
        this.intensityMilestone = settings.getTargetIntensity(
            current.skill.id,
            this.current.intensityPercentage,
            this.current.intensityMilestones,
        );
        this.intensity = this.current.intensityForMilestone(this.intensityMilestone);
    }

    intensityCompleted(): boolean {
        this.intensity = this.current.intensityForMilestone(this.intensityMilestone);
        return this.intensity <= this.current.intensity;
    }

    completed(): boolean {
        // check intensity
        return super.completed() && this.intensityCompleted();
    }
}