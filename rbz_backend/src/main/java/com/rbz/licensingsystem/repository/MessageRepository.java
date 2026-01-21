package com.rbz.licensingsystem.repository;

import com.rbz.licensingsystem.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByCompanyIdOrderByTimestampAsc(Long companyId);
}
