package com.example.voxelearth;

import org.junit.Test;
import static org.junit.Assert.*;

/**
 * Unit tests for coordinate parsing functionality.
 * Tests the parseCoordinates method to ensure it correctly identifies
 * and parses coordinate strings while rejecting invalid inputs.
 */
public class CoordinateParsingTest {

    /**
     * Helper method to invoke the parseCoordinates method.
     * 
     * NOTE: This expects VoxelEarth.parseCoordinates(String) to be a
     * static method.
     */
    private double[] invokeParseCoordinates(String location) throws Exception {
        return VoxelEarth.parseCoordinates(location);
    }

    @Test
    public void testCommaSeparatedCoordinates() throws Exception {
        double[] result = invokeParseCoordinates("40.7128, -74.0060");
        assertNotNull("Should parse comma-separated coordinates", result);
        assertEquals(40.7128, result[0], 0.0001);
        assertEquals(-74.0060, result[1], 0.0001);
    }

    @Test
    public void testCommaSeparatedCoordinatesNoSpaces() throws Exception {
        double[] result = invokeParseCoordinates("40.7128,-74.0060");
        assertNotNull("Should parse comma-separated coordinates without spaces", result);
        assertEquals(40.7128, result[0], 0.0001);
        assertEquals(-74.0060, result[1], 0.0001);
    }

    @Test
    public void testSpaceSeparatedCoordinates() throws Exception {
        double[] result = invokeParseCoordinates("40.7128 -74.0060");
        assertNotNull("Should parse space-separated coordinates", result);
        assertEquals(40.7128, result[0], 0.0001);
        assertEquals(-74.0060, result[1], 0.0001);
    }

    @Test
    public void testMultipleSpacesSeparated() throws Exception {
        double[] result = invokeParseCoordinates("40.7128   -74.0060");
        assertNotNull("Should parse coordinates with multiple spaces", result);
        assertEquals(40.7128, result[0], 0.0001);
        assertEquals(-74.0060, result[1], 0.0001);
    }

    @Test
    public void testPositiveCoordinates() throws Exception {
        double[] result = invokeParseCoordinates("51.5074, 0.1278");
        assertNotNull("Should parse positive coordinates", result);
        assertEquals(51.5074, result[0], 0.0001);
        assertEquals(0.1278, result[1], 0.0001);
    }

    @Test
    public void testIntegerCoordinates() throws Exception {
        double[] result = invokeParseCoordinates("40, -74");
        assertNotNull("Should parse integer coordinates", result);
        assertEquals(40.0, result[0], 0.0001);
        assertEquals(-74.0, result[1], 0.0001);
    }

    @Test
    public void testInvalidLatitudeTooHigh() throws Exception {
        double[] result = invokeParseCoordinates("91.0, -74.0060");
        assertNull("Should reject latitude > 90", result);
    }

    @Test
    public void testInvalidLatitudeTooLow() throws Exception {
        double[] result = invokeParseCoordinates("-91.0, -74.0060");
        assertNull("Should reject latitude < -90", result);
    }

    @Test
    public void testInvalidLongitudeTooHigh() throws Exception {
        double[] result = invokeParseCoordinates("40.7128, 181.0");
        assertNull("Should reject longitude > 180", result);
    }

    @Test
    public void testInvalidLongitudeTooLow() throws Exception {
        double[] result = invokeParseCoordinates("40.7128, -181.0");
        assertNull("Should reject longitude < -180", result);
    }

    @Test
    public void testPlaceName() throws Exception {
        double[] result = invokeParseCoordinates("New York City");
        assertNull("Should not parse place names as coordinates", result);
    }

    @Test
    public void testPlaceNameWithComma() throws Exception {
        double[] result = invokeParseCoordinates("New York, NY");
        assertNull("Should not parse place names with commas as coordinates", result);
    }

    @Test
    public void testTooManyParts() throws Exception {
        double[] result = invokeParseCoordinates("40.7128, -74.0060, 100");
        assertNull("Should reject more than 2 coordinate parts", result);
    }

    @Test
    public void testEmptyString() throws Exception {
        double[] result = invokeParseCoordinates("");
        assertNull("Should reject empty string", result);
    }

    @Test
    public void testNullString() throws Exception {
        double[] result = invokeParseCoordinates(null);
        assertNull("Should reject null string", result);
    }

    @Test
    public void testWhitespaceOnly() throws Exception {
        double[] result = invokeParseCoordinates("   ");
        assertNull("Should reject whitespace-only string", result);
    }

    @Test
    public void testSingleNumber() throws Exception {
        double[] result = invokeParseCoordinates("40.7128");
        assertNull("Should reject single number", result);
    }

    @Test
    public void testEdgeCaseMaxLatitude() throws Exception {
        double[] result = invokeParseCoordinates("90.0, 0.0");
        assertNotNull("Should accept maximum valid latitude", result);
        assertEquals(90.0, result[0], 0.0001);
        assertEquals(0.0, result[1], 0.0001);
    }

    @Test
    public void testEdgeCaseMinLatitude() throws Exception {
        double[] result = invokeParseCoordinates("-90.0, 0.0");
        assertNotNull("Should accept minimum valid latitude", result);
        assertEquals(-90.0, result[0], 0.0001);
        assertEquals(0.0, result[1], 0.0001);
    }

    @Test
    public void testEdgeCaseMaxLongitude() throws Exception {
        double[] result = invokeParseCoordinates("0.0, 180.0");
        assertNotNull("Should accept maximum valid longitude", result);
        assertEquals(0.0, result[0], 0.0001);
        assertEquals(180.0, result[1], 0.0001);
    }

    @Test
    public void testEdgeCaseMinLongitude() throws Exception {
        double[] result = invokeParseCoordinates("0.0, -180.0");
        assertNotNull("Should accept minimum valid longitude", result);
        assertEquals(0.0, result[0], 0.0001);
        assertEquals(-180.0, result[1], 0.0001);
    }

    @Test
    public void testShortDecimalNoSpaces() throws Exception {
        double[] result = invokeParseCoordinates("40.71,-74.00");
        assertNotNull("Should parse XX.XX,XX.XX format", result);
        assertEquals(40.71, result[0], 0.0001);
        assertEquals(-74.00, result[1], 0.0001);
    }

    @Test
    public void testVeryShortDecimalNoSpaces() throws Exception {
        double[] result = invokeParseCoordinates("1.5,2.5");
        assertNotNull("Should parse X.X,X.X format", result);
        assertEquals(1.5, result[0], 0.0001);
        assertEquals(2.5, result[1], 0.0001);
    }

    @Test
    public void testExtraSpacesAroundComma() throws Exception {
        double[] result = invokeParseCoordinates("40  ,  -74");
        assertNotNull("Should parse with spaces before and after comma", result);
        assertEquals(40.0, result[0], 0.0001);
        assertEquals(-74.0, result[1], 0.0001);
    }

    @Test
    public void testRealWorldAddress1() throws Exception {
        double[] result = invokeParseCoordinates("New York, NY");
        assertNull("Should NOT parse city/state as coordinates", result);
    }

    @Test
    public void testRealWorldAddress2() throws Exception {
        double[] result = invokeParseCoordinates("123 Main Street, Springfield");
        assertNull("Should NOT parse street addresses as coordinates", result);
    }

    @Test
    public void testRealWorldAddress3() throws Exception {
        double[] result = invokeParseCoordinates("Eiffel Tower, Paris");
        assertNull("Should NOT parse landmarks as coordinates", result);
    }

    @Test
    public void testNumbersButNotCoordinates() throws Exception {
        double[] result = invokeParseCoordinates("100, Park");
        assertNull("Should NOT parse non-coordinate numbers", result);
    }
}
