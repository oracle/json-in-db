package example.control;

import static org.springframework.web.bind.annotation.RequestMethod.DELETE;

import org.springframework.data.rest.webmvc.RepositoryRestController;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionCallbackWithoutResult;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import example.repository.StationRepository;
import example.repository.StatusRepository;

@RepositoryRestController
public class StationController {

    private final StationRepository stationRepo;

    private final StatusRepository statusRepo;

    private final TransactionTemplate transaction;

    public StationController(StationRepository stationRepo, StatusRepository statusRepo,
            TransactionTemplate transaction) {
        this.stationRepo = stationRepo;
        this.statusRepo = statusRepo;
        this.transaction = transaction;
    }

    @RequestMapping(method = DELETE, value = "/station/{id}")
    public @ResponseBody void getRentalUrls(@PathVariable String id) {
        transaction.execute(new TransactionCallbackWithoutResult() {
            @Override
            protected void doInTransactionWithoutResult(TransactionStatus status) {
                stationRepo.deleteById(id);
                statusRepo.deleteAllByStationId(id);
            }
        });
    }

}
