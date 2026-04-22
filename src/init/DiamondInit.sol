// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AppStorage} from "src/libraries/AppStorage.sol";
import {LibEntityRules} from "src/libraries/LibEntityRules.sol";

contract DiamondInit {
    function init() external {
        AppStorage.Layout storage s = AppStorage.layout();

        // =============================================================
        // 🔐 PROTOCOL OWNER
        // =============================================================
        s.owner = msg.sender;

        // =============================================================
        // 🎟️ TICKETS ECONOMY
        // =============================================================
        s.nudosPerTicket = 10;
        s.ticketPriceInTokens = 1 ether;
        // 1 ticket = 10 NUDOS (ajustable luego)

        // =============================================================
        // 🪙 MARKETPLACE ECONOMY
        // =============================================================
        s.marketplaceFeeBps = 250;
        // 2.5% fee marketplace

        // =============================================================
        //  RECYCLING REWARD RATES
        // =============================================================

        // PILOTO: solo aluminio activo
        // 4 latas = 1 NUDOS → 0.25 NUDOS por lata

        s.recycleRates[AppStorage.Material.AL] = 0.25 ether;
        s.rewardBaseUnit = 1;

        // materiales listos pero desactivados
        s.recycleRates[AppStorage.Material.PL] = 0;
        s.recycleRates[AppStorage.Material.CB] = 0;
        s.recycleRates[AppStorage.Material.GL] = 0;

        // =============================================================
        //  PILOT CATALOG SEED
        // =============================================================
        _seedPilotUniversities(s);
        _seedPilotCampuses(s);
        _seedPilotPrograms(s);

        // Owner starts as the first system operator for setup / cleanup tasks.
        s.isSystemAdmin[msg.sender] = true;
    }

    function _seedPilotUniversities(AppStorage.Layout storage s) internal {
        AppStorage.University storage genericUniversity = s.universities[LibEntityRules.GENERIC_UNIVERSITY_ID];

        genericUniversity.id = LibEntityRules.GENERIC_UNIVERSITY_ID;
        genericUniversity.name = "Generica";
        genericUniversity.metadataURI = "ipfs://pilot/university/generic";
        s.universityIds.push(LibEntityRules.GENERIC_UNIVERSITY_ID);

        AppStorage.University storage univalleUniversity = s.universities[LibEntityRules.UNIVALLE_UNIVERSITY_ID];

        univalleUniversity.id = LibEntityRules.UNIVALLE_UNIVERSITY_ID;
        univalleUniversity.name = "Universidad del Valle";
        univalleUniversity.metadataURI = "ipfs://pilot/university/univalle";
        s.universityIds.push(LibEntityRules.UNIVALLE_UNIVERSITY_ID);
    }

    function _seedPilotCampuses(AppStorage.Layout storage s) internal {
        _createSeedCampus(
            s,
            LibEntityRules.GENERIC_CAMPUS_ID,
            LibEntityRules.GENERIC_UNIVERSITY_ID,
            "GN",
            "ipfs://pilot/campus/generic"
        );

        _createSeedCampus(
            s, LibEntityRules.SF_CAMPUS_ID, LibEntityRules.UNIVALLE_UNIVERSITY_ID, "SF", "ipfs://pilot/campus/sf"
        );

        _createSeedCampus(
            s, LibEntityRules.MLD_CAMPUS_ID, LibEntityRules.UNIVALLE_UNIVERSITY_ID, "MLD", "ipfs://pilot/campus/mld"
        );
    }

    function _seedPilotPrograms(AppStorage.Layout storage s) internal {
        _createSeedProgram(
            s,
            1001101,
            LibEntityRules.SF_CAMPUS_ID,
            "Administracion de Empresas",
            "univalle://program/sf/administracion-de-empresas"
        );
        _createSeedProgram(
            s,
            1001102,
            LibEntityRules.SF_CAMPUS_ID,
            "Administracion Publica",
            "univalle://program/sf/administracion-publica"
        );
        _createSeedProgram(
            s, 1001103, LibEntityRules.SF_CAMPUS_ID, "Contaduria Publica", "univalle://program/sf/contaduria-publica"
        );
        _createSeedProgram(
            s, 1001104, LibEntityRules.SF_CAMPUS_ID, "Comercio Exterior", "univalle://program/sf/comercio-exterior"
        );
        _createSeedProgram(
            s, 1001105, LibEntityRules.SF_CAMPUS_ID, "Finanzas y Banca", "univalle://program/sf/finanzas-y-banca"
        );
        _createSeedProgram(
            s,
            1001106,
            LibEntityRules.SF_CAMPUS_ID,
            "Administracion Turistica",
            "univalle://program/sf/administracion-turistica"
        );
        _createSeedProgram(
            s,
            1001107,
            LibEntityRules.SF_CAMPUS_ID,
            "Gestion del Emprendimiento y la Innovacion",
            "univalle://program/sf/gestion-del-emprendimiento-y-la-innovacion"
        );
        _createSeedProgram(
            s,
            1001201,
            LibEntityRules.SF_CAMPUS_ID,
            "Bacteriologia y Laboratorio Clinico",
            "univalle://program/sf/bacteriologia-y-laboratorio-clinico"
        );
        _createSeedProgram(s, 1001202, LibEntityRules.SF_CAMPUS_ID, "Enfermeria", "univalle://program/sf/enfermeria");
        _createSeedProgram(
            s, 1001203, LibEntityRules.SF_CAMPUS_ID, "Fisioterapia", "univalle://program/sf/fisioterapia"
        );
        _createSeedProgram(
            s, 1001204, LibEntityRules.SF_CAMPUS_ID, "Fonoaudiologia", "univalle://program/sf/fonoaudiologia"
        );
        _createSeedProgram(
            s, 1001205, LibEntityRules.SF_CAMPUS_ID, "Medicina y Cirugia", "univalle://program/sf/medicina-y-cirugia"
        );
        _createSeedProgram(s, 1001206, LibEntityRules.SF_CAMPUS_ID, "Odontologia", "univalle://program/sf/odontologia");
        _createSeedProgram(
            s, 1001207, LibEntityRules.SF_CAMPUS_ID, "Terapia Ocupacional", "univalle://program/sf/terapia-ocupacional"
        );
        _createSeedProgram(
            s,
            1001208,
            LibEntityRules.SF_CAMPUS_ID,
            "Tecnologia en Atencion Prehospitalaria",
            "univalle://program/sf/tecnologia-en-atencion-prehospitalaria"
        );
    }

    function _createSeedCampus(
        AppStorage.Layout storage s,
        uint256 campusId,
        uint256 universityId,
        string memory name,
        string memory metadataURI
    ) internal {
        AppStorage.Campus storage c = s.campuses[campusId];
        c.id = campusId;
        c.universityId = universityId;
        c.name = name;
        c.metadataURI = metadataURI;

        s.campusIds.push(campusId);
        s.universities[universityId].campusIds.push(campusId);
    }

    function _createSeedProgram(
        AppStorage.Layout storage s,
        uint256 programId,
        uint256 campusId,
        string memory name,
        string memory metadataURI
    ) internal {
        AppStorage.Program storage p = s.programs[programId];
        p.id = programId;
        p.campusId = campusId;
        p.name = name;
        p.metadataURI = metadataURI;
        p.coordinator = address(0);

        s.programIds.push(programId);
        s.campuses[campusId].programIds.push(programId);
    }
}
