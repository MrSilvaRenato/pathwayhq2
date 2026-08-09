<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BrisbaneClubsSeeder extends Seeder
{
    public function run(): void
    {
        $clubs = [
            [
                'name'         => 'Albany Creek Excelsior FC',
                'city'         => 'Albany Creek',
                'founded_year' => 1973,
                'description'  => 'One of Brisbane\'s north side stalwarts, Albany Creek Excelsior FC has served the local community for over five decades across men\'s, women\'s and junior competitions.',
            ],
            [
                'name'         => 'Acacia Ridge FC',
                'city'         => 'Acacia Ridge',
                'founded_year' => 1962,
                'description'  => 'A proud south-side community club, Acacia Ridge FC has developed local talent across all age groups since the 1960s.',
            ],
            [
                'name'         => 'Bardon Latrobe FC',
                'city'         => 'Bardon',
                'founded_year' => 1958,
                'description'  => 'One of Brisbane\'s oldest clubs, Bardon Latrobe FC has a rich history and strong community ties in the inner-west suburbs.',
            ],
            [
                'name'         => 'Brighton Roosters SC',
                'city'         => 'Brighton',
                'founded_year' => 1972,
                'description'  => 'The Roosters are a well-established north-side club serving Brighton and surrounding Bayside suburbs with quality grassroots football.',
            ],
            [
                'name'         => 'Bulimba FC',
                'city'         => 'Bulimba',
                'founded_year' => 1960,
                'description'  => 'Competing in Football Brisbane competitions for decades, Bulimba FC is the heart of football in Brisbane\'s inner east.',
            ],
            [
                'name'         => 'Capalaba SC',
                'city'         => 'Capalaba',
                'founded_year' => 1976,
                'description'  => 'Capalaba SC is Redlands\' leading amateur football club, running senior men\'s, women\'s and over-age teams across Football Brisbane competitions.',
            ],
            [
                'name'         => 'Centenary Stormers FC',
                'city'         => 'Jindalee',
                'founded_year' => 1995,
                'description'  => 'Serving the Centenary suburbs of western Brisbane, the Stormers provide competitive and social football for all ages and skill levels.',
            ],
            [
                'name'         => 'Coorparoo SC',
                'city'         => 'Coorparoo',
                'founded_year' => 1961,
                'description'  => 'A strong inner-south club with a long tradition of community football, Coorparoo SC has produced numerous representative players over the years.',
            ],
            [
                'name'         => 'Darra United FC',
                'city'         => 'Darra',
                'founded_year' => 1968,
                'description'  => 'Darra United FC represents one of Brisbane\'s most multicultural communities, reflecting the diverse spirit of Brisbane\'s western suburbs.',
            ],
            [
                'name'         => 'Eastern Suburbs FC',
                'city'         => 'Greenslopes',
                'founded_year' => 1929,
                'description'  => 'One of Brisbane\'s oldest and most decorated clubs, Eastern Suburbs FC has competed at the highest amateur levels in Queensland football for nearly a century.',
            ],
            [
                'name'         => 'Gap FC',
                'city'         => 'The Gap',
                'founded_year' => 1973,
                'description'  => 'Nestled in the foothills of Brisbane\'s north-west, Gap FC is the home of football for The Gap and Enoggera communities.',
            ],
            [
                'name'         => 'Goodna & Districts SC',
                'city'         => 'Goodna',
                'founded_year' => 1963,
                'description'  => 'Serving Ipswich\'s eastern corridor, Goodna & Districts SC has been a cornerstone of football in the region for over 60 years.',
            ],
            [
                'name'         => 'Inala City FC',
                'city'         => 'Inala',
                'founded_year' => 1965,
                'description'  => 'Inala City FC is deeply embedded in one of Brisbane\'s most vibrant multicultural communities, providing a home for football across all backgrounds.',
            ],
            [
                'name'         => 'Ipswich City FC',
                'city'         => 'Ipswich',
                'founded_year' => 1979,
                'description'  => 'Representing the city of Ipswich in Football Brisbane competitions, Ipswich City FC fields competitive senior and veterans sides.',
            ],
            [
                'name'         => 'Kenmore Rangers FC',
                'city'         => 'Kenmore',
                'founded_year' => 1971,
                'description'  => 'Kenmore Rangers FC is the club of choice in Brisbane\'s western suburbs, offering competitive football in a family-friendly environment.',
            ],
            [
                'name'         => 'Loganholme FC',
                'city'         => 'Loganholme',
                'founded_year' => 1980,
                'description'  => 'Loganholme FC serves the rapidly growing Logan corridor, fielding teams across multiple Football Brisbane divisions.',
            ],
            [
                'name'         => 'Lutwyche United FC',
                'city'         => 'Windsor',
                'founded_year' => 1950,
                'description'  => 'A heritage club with decades of history, Lutwyche United FC continues to serve the inner-north Brisbane football community.',
            ],
            [
                'name'         => 'Mitchelton FC',
                'city'         => 'Mitchelton',
                'founded_year' => 1962,
                'description'  => 'Mitchelton FC has been a cornerstone of north-west Brisbane football for over six decades, fielding senior and veterans teams with pride.',
            ],
            [
                'name'         => 'Moggill FC',
                'city'         => 'Moggill',
                'founded_year' => 1978,
                'description'  => 'Set in Brisbane\'s leafy western fringes, Moggill FC is a tight-knit community club with strong junior and senior programmes.',
            ],
            [
                'name'         => 'Mooroondu FC',
                'city'         => 'Thorneside',
                'founded_year' => 1969,
                'description'  => 'Mooroondu FC is Bayside Brisbane\'s beloved community football club, competing in Football Brisbane\'s amateur divisions since 1969.',
            ],
            [
                'name'         => 'Mt Gravatt SC',
                'city'         => 'Mt Gravatt',
                'founded_year' => 1963,
                'description'  => 'Mt Gravatt SC has served the south-east corridor of Brisbane for over 60 years, fielding competitive teams across men\'s and women\'s competitions.',
            ],
            [
                'name'         => 'Narangba Valley FC',
                'city'         => 'Narangba',
                'founded_year' => 1988,
                'description'  => 'Narangba Valley FC serves Brisbane\'s fast-growing northern growth corridor, providing quality football for a rapidly expanding community.',
            ],
            [
                'name'         => 'Newmarket FC',
                'city'         => 'Newmarket',
                'founded_year' => 1964,
                'description'  => 'Newmarket FC is a classic Brisbane inner-north club with a strong culture of developing players from grassroots to senior level.',
            ],
            [
                'name'         => 'North Star FC',
                'city'         => 'Zillmere',
                'founded_year' => 1956,
                'description'  => 'One of Brisbane\'s most storied clubs, North Star FC competes across multiple Football Brisbane divisions with strong men\'s and women\'s programmes.',
            ],
            [
                'name'         => 'Northside Wolves FC',
                'city'         => 'Stafford',
                'founded_year' => 1970,
                'description'  => 'The Wolves have been a competitive force in north Brisbane football for over 50 years, with a strong focus on community and player development.',
            ],
            [
                'name'         => 'Olympic FC',
                'city'         => 'Yeronga',
                'founded_year' => 1952,
                'description'  => 'Olympic FC is one of Queensland\'s most decorated amateur clubs, with a proud history of competition at the highest levels of Brisbane football.',
            ],
            [
                'name'         => 'Park Ridge FC',
                'city'         => 'Park Ridge',
                'founded_year' => 1982,
                'description'  => 'Park Ridge FC caters to Brisbane\'s south-side growth areas, providing football for senior, over-35 and social players.',
            ],
            [
                'name'         => 'Pine Hills FC',
                'city'         => 'Bunya',
                'founded_year' => 1976,
                'description'  => 'Situated in Brisbane\'s leafy northern suburbs, Pine Hills FC offers competitive and social football for the local community.',
            ],
            [
                'name'         => 'Pine Rivers United FC',
                'city'         => 'Strathpine',
                'founded_year' => 1977,
                'description'  => 'Pine Rivers United FC is the northern corridor\'s premier community club, serving Strathpine and surrounding suburbs for nearly 50 years.',
            ],
            [
                'name'         => 'Redcliffe City FC',
                'city'         => 'Redcliffe',
                'founded_year' => 1969,
                'description'  => 'Redcliffe City FC is the Redcliffe Peninsula\'s home of football, providing competitive senior and veterans football for the bayside community.',
            ],
            [
                'name'         => 'Redlands United FC',
                'city'         => 'Cleveland',
                'founded_year' => 1975,
                'description'  => 'Redlands United FC represents the broader Redlands region, competing in Football Brisbane competitions from their home base in Cleveland.',
            ],
            [
                'name'         => 'Rochedale Rovers FC',
                'city'         => 'Rochedale',
                'founded_year' => 1974,
                'description'  => 'Rochedale Rovers FC is one of Brisbane\'s south-side powerhouses, with a strong culture across men\'s, women\'s and over-age competitions.',
            ],
            [
                'name'         => 'Samford FC',
                'city'         => 'Samford',
                'founded_year' => 1969,
                'description'  => 'Perched in the D\'Aguilar foothills, Samford FC is a proud rural community club bringing quality football to Brisbane\'s semi-rural north-west.',
            ],
            [
                'name'         => 'Slacks Creek FC',
                'city'         => 'Slacks Creek',
                'founded_year' => 1966,
                'description'  => 'Slacks Creek FC is a well-established Logan-area club with decades of experience developing footballers in Brisbane\'s southern suburbs.',
            ],
            [
                'name'         => 'Souths United FC',
                'city'         => 'Acacia Ridge',
                'founded_year' => 1948,
                'description'  => 'Souths United FC is one of Brisbane\'s most historic clubs, with over 75 years of continuous competition and strong ties to the southern Brisbane community.',
            ],
            [
                'name'         => 'Springfield City FC',
                'city'         => 'Springfield',
                'founded_year' => 2005,
                'description'  => 'Springfield City FC is one of Queensland\'s newest clubs, growing rapidly alongside the booming Springfield Lakes development in Ipswich\'s east.',
            ],
            [
                'name'         => 'Sunnybank FC',
                'city'         => 'Sunnybank',
                'founded_year' => 1974,
                'description'  => 'Sunnybank FC serves one of Brisbane\'s most multicultural communities, with vibrant men\'s, women\'s and veterans programmes.',
            ],
            [
                'name'         => 'Taringa Rovers FC',
                'city'         => 'Taringa',
                'founded_year' => 1957,
                'description'  => 'A long-standing inner-west Brisbane club, Taringa Rovers FC is known for its friendly culture and competitive senior football.',
            ],
            [
                'name'         => 'Toowong FC',
                'city'         => 'Toowong',
                'founded_year' => 1965,
                'description'  => 'Toowong FC is an inner-west institution, providing quality football for Brisbane\'s university and professional community since the 1960s.',
            ],
            [
                'name'         => 'University of Queensland FC',
                'city'         => 'St Lucia',
                'founded_year' => 1937,
                'description'  => 'One of Queensland\'s oldest university sports clubs, UQ FC competes in Football Brisbane competitions and provides a home for student and community footballers.',
            ],
            [
                'name'         => 'Virginia United FC',
                'city'         => 'Virginia',
                'founded_year' => 1972,
                'description'  => 'Virginia United FC has served the northern Brisbane suburb of Virginia for over 50 years, competing across multiple Football Brisbane divisions.',
            ],
            [
                'name'         => 'Westside Wanderers FC',
                'city'         => 'Kenmore',
                'founded_year' => 1983,
                'description'  => 'Westside Wanderers FC brings together players from Brisbane\'s western suburbs in a welcoming, community-focused environment.',
            ],
            [
                'name'         => 'Woodridge FC',
                'city'         => 'Woodridge',
                'founded_year' => 1975,
                'description'  => 'Woodridge FC is a proud Logan City club representing one of Brisbane\'s most diverse communities in Football Brisbane competitions.',
            ],
            [
                'name'         => 'Wynnum Wolves FC',
                'city'         => 'Wynnum',
                'founded_year' => 1930,
                'description'  => 'The Wolves are a Bayside institution, one of Brisbane\'s oldest clubs with nearly a century of football heritage serving the Wynnum-Manly community.',
            ],
            [
                'name'         => 'Yeronga SSC',
                'city'         => 'Yeronga',
                'founded_year' => 1930,
                'description'  => 'Yeronga Social & Sporting Club is one of Brisbane\'s most venerable football organisations, with over 90 years of community sport on Brisbane\'s inner south.',
            ],
            [
                'name'         => 'Annerley FC',
                'city'         => 'Annerley',
                'founded_year' => 1935,
                'description'  => 'A heritage inner-south club, Annerley FC has been a fixture in Brisbane amateur football for nearly 90 years.',
            ],
            [
                'name'         => 'Beenleigh FC',
                'city'         => 'Beenleigh',
                'founded_year' => 1961,
                'description'  => 'Beenleigh FC serves the southern gateway to Brisbane, providing competitive football for the Logan and Beenleigh communities.',
            ],
            [
                'name'         => 'Bribie Island FC',
                'city'         => 'Bribie Island',
                'founded_year' => 1987,
                'description'  => 'Bribie Island FC brings competitive football to one of Queensland\'s most unique island communities, north of Brisbane.',
            ],
            [
                'name'         => 'Lions SC',
                'city'         => 'Richlands',
                'founded_year' => 1952,
                'description'  => 'Lions SC is a proud south-west Brisbane club with over 70 years of history, providing football for the Richlands and Forest Lake communities.',
            ],
            [
                'name'         => 'Wolter Park Lions',
                'city'         => 'Nundah',
                'founded_year' => 1955,
                'description'  => 'Wolter Park Lions is a north-side community club based in Nundah, serving the Northgate and Airport corridor suburbs for seven decades.',
            ],
        ];

        foreach ($clubs as $club) {
            $slug = Str::slug($club['name']);

            // Skip if slug already exists
            if (DB::table('clubs')->where('slug', $slug)->exists()) {
                continue;
            }

            DB::table('clubs')->insert([
                'id'           => (string) Str::uuid(),
                'name'         => $club['name'],
                'sport'        => 'soccer',
                'city'         => $club['city'],
                'state'        => 'QLD',
                'slug'         => $slug,
                'description'  => $club['description'],
                'founded_year' => $club['founded_year'],
                'is_public'    => true,
                'is_claimed'   => false,
            ]);
        }

        $this->command->info('Seeded ' . count($clubs) . ' Brisbane metro soccer clubs.');
    }
}
