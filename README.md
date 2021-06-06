# space-invaders
Semestrální práce na předmět KAJ
Single page aplikace na klasickou arkádovou hru Space Invaders.
Dostupná i na adrese: https://silviephan.github.io/space-invaders/


### Použité technologie
-	Localstorage API - ukládání výsledků her
-	History API - přepínání mezi "stránkama"
-	Canvas - pozadí stránky a samotná hrací plocha Space Invaders
-	Media API - přehrávání zvůkových efektů
-	Flex - použití na responzivní vzhled
-	CSS3 transformace 2D/3D - START GAME button
-	CSS3 transitions/animations - Hlavní titul Space Invaders

### Popis funkčnosti
Po spuštění aplikace se zobrazí hlavní menu s instrukcemi ovládádacích tlačítek. Po stisknutí [START GAME] se spustí hrací panel a hra začíná. Hráč může přejít zpět na hlavní menu stisknutím na [BACK], anebo si může ztlumit zvuk v pravém horním rohu. Hra se ukončí pokud hráč sestřelí všechny vetřelece na herní ploše nebo je hráč zasažen projektily či vetřelci úspěšně dorazili ke hráči.
Pokud hráč dosáhl skóre vyšší než 0, tak se zobrazí okno, kde vyplní jméno o délce 3 až 12 znaků, který se poté vloží do celkové výsledkové tabulky. Pokud bylo konečné skóre 0, tak se přejde rovnou na panel GAME OVER s výsledky hry.
