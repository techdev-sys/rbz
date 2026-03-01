package com.rbz.licensingsystem.model;

import com.rbz.licensingsystem.model.enums.ApplicationStage;
import com.rbz.licensingsystem.model.enums.StageStatus;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "stage_status")
public class StageProgression {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long companyId;

    @Enumerated(EnumType.STRING)
    private ApplicationStage stage;

    @Enumerated(EnumType.STRING)
    private StageStatus status;

    private String completedBy;
    private LocalDateTime completedAt;
}
